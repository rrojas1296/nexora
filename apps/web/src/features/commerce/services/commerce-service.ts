"use client";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/api-error";
import { authService, withAuthenticatedSession } from "@/features/auth/services/auth-service";
import { clientResponseSchema, clientsSchema } from "@/features/clients/schemas/client-schema";
import { orderResponseSchema, ordersSchema } from "@/features/orders/schemas/order-schema";
import type { CommerceFilters, CommerceScope } from "../schemas/commerce-schema";
type Resource = "clients" | "orders";
function url(scope: CommerceScope, resource: Resource) {
  return `/businesses/${scope.businessId}/${resource}`;
}
async function read<T>(
  scope: CommerceScope,
  signal: AbortSignal,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    signal.throwIfAborted();
    if (normalizeApiError(error).status !== 401) throw error;
    const session = await authService.current();
    signal.throwIfAborted();
    if (
      !session ||
      session.user.id !== scope.userId ||
      session.activeBusinessId !== scope.businessId
    )
      throw new Error("SESSION_CHANGED");
    return operation();
  }
}
function list<T>(
  scope: CommerceScope,
  resource: Resource,
  schema: z.ZodType<T>,
  filters: CommerceFilters,
  signal: AbortSignal,
) {
  return read(scope, signal, async () =>
    schema.parse((await apiClient.get(url(scope, resource), { params: filters, signal })).data),
  );
}
function get<T>(
  scope: CommerceScope,
  resource: Resource,
  schema: z.ZodType<{ data: T }>,
  id: string,
  signal: AbortSignal,
) {
  return read(
    scope,
    signal,
    async () =>
      schema.parse((await apiClient.get(`${url(scope, resource)}/${id}`, { signal })).data).data,
  );
}
export const commerceService = {
  clients: (scope: CommerceScope, filters: CommerceFilters, signal: AbortSignal) =>
    list(scope, "clients", clientsSchema, filters, signal),
  orders: (scope: CommerceScope, filters: CommerceFilters, signal: AbortSignal) =>
    list(scope, "orders", ordersSchema, filters, signal),
  client: (scope: CommerceScope, id: string, signal: AbortSignal) =>
    get(scope, "clients", clientResponseSchema, id, signal),
  order: (scope: CommerceScope, id: string, signal: AbortSignal) =>
    get(scope, "orders", orderResponseSchema, id, signal),
  save: (scope: CommerceScope, resource: Resource, input: unknown, id?: string) =>
    withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
        throw new Error("SESSION_CHANGED");
      const response = id
        ? await apiClient.patch(`${url(scope, resource)}/${id}`, input, { headers })
        : await apiClient.post(url(scope, resource), input, { headers });
      return resource === "clients"
        ? clientResponseSchema.parse(response.data).data
        : orderResponseSchema.parse(response.data).data;
    }),
};
