import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service.js";
import { Prisma } from "../../../database/generated/client.js";
import { authorizeCommerce } from "../../../common/commerce/authorize-commerce.js";
import { CommerceError, type CommerceActor } from "../../../common/commerce/commerce.js";
import type { AddressInput } from "../models/client-address.js";
import type { IClientAddressesRepository } from "./client-addresses.repository.js";
import {
  customerAddresses,
  removeCustomerAddress,
  saveCustomerAddress,
} from "./client-address-store.js";
@Injectable()
export class PrismaClientAddressesRepository implements IClientAddressesRepository {
  constructor(private readonly prisma: PrismaService) {}
  private async transaction<T>(
    actor: CommerceActor,
    write: boolean,
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    try {
      return await this.prisma.client.$transaction(async (tx) => {
        if (write)
          await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${actor.businessId}::uuid FOR NO KEY UPDATE`;
        await authorizeCommerce(tx, actor, write);
        return action(tx);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(error.code)
      )
        throw new CommerceError("COMMERCE_CONFLICT");
      throw error;
    }
  }
  list(actor: CommerceActor, clientId: string) {
    return this.transaction(actor, false, (tx) =>
      customerAddresses(tx, actor.businessId!, clientId),
    );
  }
  save(actor: CommerceActor, clientId: string, id: string, input: AddressInput, version?: number) {
    return this.transaction(actor, true, (tx) =>
      saveCustomerAddress(tx, actor.businessId!, clientId, input, id, version),
    );
  }
  remove(actor: CommerceActor, clientId: string, id: string, version: number) {
    return this.transaction(actor, true, (tx) =>
      removeCustomerAddress(tx, actor.businessId!, clientId, id, version),
    );
  }
}
