import { createHash } from "node:crypto";
import type { Prisma } from "../../../database/generated/client.js";
import { CommerceError } from "../../../common/commerce/commerce.js";
import type { AddressInput, AddressView } from "../models/client-address.js";

type Tx = Prisma.TransactionClient;
export function addressView(row: AddressView): AddressView {
  const {
    id,
    version,
    label,
    address,
    reference,
    country,
    city,
    district,
    latitude,
    longitude,
    isDefault,
  } = row;
  return {
    id,
    version,
    label,
    address,
    reference,
    country,
    city,
    district,
    latitude,
    longitude,
    isDefault,
  };
}
export async function activeAddressClient(tx: Tx, businessId: string, clientId: string) {
  const row = await tx.client.findFirst({
    where: { id: clientId, businessId, isDeleted: false, active: true },
  });
  if (!row) throw new CommerceError("COMMERCE_INVALID_CLIENT");
}
export async function customerAddresses(tx: Tx, businessId: string, clientId: string) {
  await activeAddressClient(tx, businessId, clientId);
  return (
    await tx.clientAddress.findMany({
      where: { businessId, clientId, isDeleted: false },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      take: 10,
    })
  ).map(addressView);
}
export async function customerAddress(
  tx: Tx,
  businessId: string,
  clientId: string,
  id: string,
  version?: number,
) {
  await activeAddressClient(tx, businessId, clientId);
  const row = await tx.clientAddress.findFirst({
    where: { id, businessId, clientId, isDeleted: false },
  });
  if (!row) throw new CommerceError("COMMERCE_NOT_FOUND");
  if (version !== undefined && row.version !== version)
    throw new CommerceError("COMMERCE_CONFLICT");
  return row;
}
// Callers hold the business lock, shared by panel writes and AI tools.
export async function saveCustomerAddress(
  tx: Tx,
  businessId: string,
  clientId: string,
  input: AddressInput,
  id: string,
  version?: number,
) {
  await activeAddressClient(tx, businessId, clientId);
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  if (version === undefined) {
    const existing = await tx.clientAddress.findUnique({ where: { id } });
    if (existing) {
      if (
        existing.businessId !== businessId ||
        existing.clientId !== clientId ||
        existing.isDeleted ||
        existing.creationHash !== hash
      )
        throw new CommerceError("COMMERCE_CONFLICT");
      return addressView(existing);
    }
    if ((await tx.clientAddress.count({ where: { businessId, clientId, isDeleted: false } })) >= 10)
      throw new CommerceError("COMMERCE_CONFLICT");
  } else await customerAddress(tx, businessId, clientId, id, version);
  if (input.isDefault)
    await tx.clientAddress.updateMany({
      where: { businessId, clientId, isDeleted: false, isDefault: true, id: { not: id } },
      data: { isDefault: false, version: { increment: 1 } },
    });
  const row =
    version === undefined
      ? await tx.clientAddress.create({
          data: { ...input, id, businessId, clientId, creationHash: hash },
        })
      : await tx.clientAddress.update({
          where: { id },
          data: { ...input, version: { increment: 1 } },
        });
  return addressView(row);
}
export async function removeCustomerAddress(
  tx: Tx,
  businessId: string,
  clientId: string,
  id: string,
  version: number,
) {
  await customerAddress(tx, businessId, clientId, id, version);
  await tx.clientAddress.update({
    where: { id },
    data: { isDeleted: true, isDefault: false, version: { increment: 1 } },
  });
}
