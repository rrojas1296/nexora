import type { CommerceActor } from "../../../common/commerce/commerce.js";
import type { AddressInput, AddressView } from "../models/client-address.js";
export const CLIENT_ADDRESSES_REPOSITORY = Symbol("CLIENT_ADDRESSES_REPOSITORY");
export interface IClientAddressesRepository {
  list(actor: CommerceActor, clientId: string): Promise<AddressView[]>;
  save(
    actor: CommerceActor,
    clientId: string,
    id: string,
    input: AddressInput,
    version?: number,
  ): Promise<AddressView>;
  remove(actor: CommerceActor, clientId: string, id: string, version: number): Promise<void>;
}
