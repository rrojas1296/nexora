import { Inject, Injectable } from "@nestjs/common";
import { CLIENTS_REPOSITORY, type IClientsRepository } from "../repositories/clients.repository.js";
import {
  checkBusiness,
  type CommerceActor,
  type CommerceQuery,
} from "../../../common/commerce/commerce.js";
import type { ClientInput } from "../models/client.js";
@Injectable()
export class ClientsService {
  constructor(@Inject(CLIENTS_REPOSITORY) private readonly repository: IClientsRepository) {}
  list(actor: CommerceActor, businessId: string, query: CommerceQuery) {
    checkBusiness(actor, businessId);
    return this.repository.list(actor, query);
  }
  get(actor: CommerceActor, businessId: string, id: string) {
    checkBusiness(actor, businessId);
    return this.repository.get(actor, id);
  }
  create(actor: CommerceActor, businessId: string, input: ClientInput & { id: string }) {
    checkBusiness(actor, businessId);
    return this.repository.create(actor, input);
  }
  update(
    actor: CommerceActor,
    businessId: string,
    id: string,
    input: ClientInput & { version: number },
  ) {
    checkBusiness(actor, businessId);
    return this.repository.update(actor, id, input);
  }
}
