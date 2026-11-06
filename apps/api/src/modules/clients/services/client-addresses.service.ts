import { Inject, Injectable } from "@nestjs/common";
import { checkBusiness, type CommerceActor } from "../../../common/commerce/commerce.js";
import type { AddressInput } from "../models/client-address.js";
import {
  CLIENT_ADDRESSES_REPOSITORY,
  type IClientAddressesRepository,
} from "../repositories/client-addresses.repository.js";
@Injectable()
export class ClientAddressesService {
  constructor(
    @Inject(CLIENT_ADDRESSES_REPOSITORY) private readonly repository: IClientAddressesRepository,
  ) {}
  list(actor: CommerceActor, businessId: string, clientId: string) {
    checkBusiness(actor, businessId);
    return this.repository.list(actor, clientId);
  }
  save(
    actor: CommerceActor,
    businessId: string,
    clientId: string,
    id: string,
    input: AddressInput,
    version?: number,
  ) {
    checkBusiness(actor, businessId);
    return this.repository.save(actor, clientId, id, input, version);
  }
  remove(actor: CommerceActor, businessId: string, clientId: string, id: string, version: number) {
    checkBusiness(actor, businessId);
    return this.repository.remove(actor, clientId, id, version);
  }
}
