import type { CommerceActor, CommerceQuery } from "../../../common/commerce/commerce.js";
import type { ClientInput, ClientView } from "../models/client.js";
export const CLIENTS_REPOSITORY = Symbol("ClientsRepository");

export interface IClientsRepository {
  list(
    actor: CommerceActor,
    query: CommerceQuery,
  ): Promise<{
    data: ClientView[];
    pagination: { page: number; pageSize: number; total: number; pages: number };
    summary: { total: number; active: number; vip: number };
  }>;
  get(actor: CommerceActor, id: string): Promise<ClientView>;
  create(actor: CommerceActor, input: ClientInput & { id: string }): Promise<ClientView>;
  update(
    actor: CommerceActor,
    id: string,
    input: ClientInput & { version: number },
  ): Promise<ClientView>;
}
