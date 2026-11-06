import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "../../../database/generated/client.js";
import type { AiReplyWork } from "../contracts/whatsapp-ai-store.js";
import type { AiToolResult } from "../contracts/ai-tools.js";
import { toolSchemas } from "../dto/whatsapp-tools.js";
import type { AddressInput } from "../../clients/models/client-address.js";
import { addressInput } from "../../clients/dto/client-addresses.dto.js";
import {
  customerAddresses,
  customerAddress,
  saveCustomerAddress,
  removeCustomerAddress,
} from "../../clients/repositories/client-address-store.js";
import { acceptedCustomerCommand } from "./accepted-customer-command.js";
import { ToolInputError } from "./whatsapp-tool-error.js";
const payloadSchema = z.object({
  operation: z.enum(["SAVE", "UPDATE", "REMOVE"]),
  addressId: z.uuid(),
  addressVersion: z.number().int().nonnegative().nullable(),
  input: addressInput,
});
export async function runAddressTool(
  tx: Prisma.TransactionClient,
  work: AiReplyWork,
  clientId: string,
  name: string,
  input: unknown,
): Promise<AiToolResult> {
  const scope = {
    businessId: work.businessId,
    threadId: work.threadId,
    clientId,
    isDeleted: false,
  };
  if (name === "list_customer_addresses") {
    const pending = await tx.whatsappAddressAction.findFirst({
      where: { ...scope, expiresAt: { gt: new Date() } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      data: {
        addresses: await customerAddresses(tx, work.businessId, clientId),
        pendingActionId: pending?.id ?? null,
      },
    };
  }
  if (name === "confirm_address_change") {
    const { actionId } = toolSchemas.confirm_address_change.parse(input);
    const action = await tx.whatsappAddressAction.findFirst({
      where: { ...scope, id: actionId, expiresAt: { gt: new Date() } },
    });
    if (!action) throw new ToolInputError("ADDRESS_ACTION_EXPIRED_OR_COMPLETED");
    if (
      !(await acceptedCustomerCommand(tx, work, action.jobId, [
        `DIRECCION ${action.token}`,
        `ADDRESS ${action.token}`,
      ]))
    )
      throw new ToolInputError("EXPLICIT_ADDRESS_CONFIRMATION_REQUIRED");
    const payload = payloadSchema.parse(action.payload);
    if (payload.operation === "REMOVE") {
      if (payload.addressVersion === null) throw new ToolInputError("ADDRESS_VERSION_REQUIRED");
      await removeCustomerAddress(
        tx,
        work.businessId,
        clientId,
        payload.addressId,
        payload.addressVersion,
      );
    } else
      await saveCustomerAddress(
        tx,
        work.businessId,
        clientId,
        payload.input,
        payload.addressId,
        payload.addressVersion ?? undefined,
      );
    await tx.whatsappAddressAction.update({ where: { id: action.id }, data: { isDeleted: true } });
    return {
      data: { completed: true },
      finalText:
        work.input.responseLanguage === "en"
          ? "Address book updated. This does not confirm a purchase or change any order destination."
          : "Direcciones actualizadas. Esto no confirma una compra ni cambia el destino de ningún pedido.",
    };
  }
  const args = toolSchemas.request_address_change.parse(input);
  if (args.operation !== "SAVE" && (!args.addressId || args.addressVersion === null))
    throw new ToolInputError("ADDRESS_VERSION_REQUIRED");
  if (args.operation === "SAVE" && (args.addressId || args.addressVersion !== null))
    throw new ToolInputError("INVALID_ADDRESS_ACTION");
  const existing =
    args.operation !== "SAVE"
      ? await customerAddress(tx, work.businessId, clientId, args.addressId!, args.addressVersion!)
      : null;
  let destination: (AddressInput & { id: string }) | null = existing;
  if (args.operation !== "REMOVE") {
    if (!args.orderId || args.orderVersion === null || !args.label)
      throw new ToolInputError("DELIVERY_DRAFT_REQUIRED");
    const draft = await tx.order.findFirst({
      where: {
        id: args.orderId,
        ...scope,
        status: "DRAFT",
        version: args.orderVersion,
        deliveryMode: "DELIVERY",
      },
    });
    if (!draft || !draft.deliveryAddress.trim())
      throw new ToolInputError("DELIVERY_DRAFT_REQUIRED");
    destination = {
      ...args,
      address: draft.deliveryAddress,
      reference: draft.deliveryReference,
      latitude: draft.deliveryLatitude,
      longitude: draft.deliveryLongitude,
      id: args.addressId ?? randomUUID(),
    };
  }
  if (!destination) throw new ToolInputError("ADDRESS_NOT_FOUND");
  const fields = addressInput.parse({
    label: destination.label,
    address: destination.address,
    reference: destination.reference,
    country: destination.country,
    city: destination.city,
    district: destination.district,
    latitude: destination.latitude,
    longitude: destination.longitude,
    isDefault: destination.isDefault,
  });
  await tx.whatsappAddressAction.updateMany({ where: scope, data: { isDeleted: true } });
  const token = randomBytes(5).toString("hex").toUpperCase();
  const action = await tx.whatsappAddressAction.create({
    data: {
      businessId: work.businessId,
      clientId,
      threadId: work.threadId,
      jobId: work.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 60_000),
      payload: {
        operation: args.operation,
        addressId: destination.id,
        addressVersion: args.addressVersion,
        input: fields,
      },
    },
  });
  const en = work.input.responseLanguage === "en";
  const verbs = {
    SAVE: en ? "Save" : "Guardar",
    UPDATE: en ? "Update" : "Actualizar",
    REMOVE: en ? "Remove" : "Eliminar",
  };
  const text = [
    `${verbs[args.operation]}: ${fields.label}`,
    fields.address,
    fields.reference,
    [fields.district, fields.city, fields.country].filter(Boolean).join(", "),
    fields.latitude !== null ? `${fields.latitude}, ${fields.longitude}` : "",
    en
      ? `Default address: ${fields.isDefault ? "yes" : "no"}`
      : `Dirección predeterminada: ${fields.isDefault ? "sí" : "no"}`,
    en
      ? "Only your address book changes. This is not a purchase confirmation. Expires in 30 minutes. To authorize, reply exactly:"
      : "Solo cambia tu libreta de direcciones. No confirma una compra. Vence en 30 minutos. Para autorizar, responde exactamente:",
    `${en ? "ADDRESS" : "DIRECCION"} ${token}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { data: { pendingActionId: action.id, saved: false }, finalText: text };
}
