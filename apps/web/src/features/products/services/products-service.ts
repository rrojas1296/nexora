"use client";

import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/api-error";
import { authService, withAuthenticatedSession } from "@/features/auth/services/auth-service";
import {
  productListSchema,
  productResponseSchema,
  type ProductInput,
  type ProductListFilters,
  type ProductScope,
} from "../schemas/product-schema";

function productUrl(scope: ProductScope) {
  return `/businesses/${scope.businessId}/products`;
}

async function read<T>(scope: ProductScope, signal: AbortSignal, operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    signal.throwIfAborted();
    if (normalizeApiError(error).status !== 401) throw error;
    const session = await authService.current();
    signal.throwIfAborted();
    if (!session) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
    if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
      throw new Error("SESSION_CHANGED");
    // Only a rejected read is replayed, once, after coordinated session recovery.
    return operation();
  }
}

function mutate<T>(
  scope: ProductScope,
  operation: (url: string, headers: Record<string, string>) => Promise<T>,
) {
  return withAuthenticatedSession(async (session, headers) => {
    if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
      throw new Error("SESSION_CHANGED");
    return operation(productUrl(scope), headers);
  });
}

function serialize(input: ProductInput) {
  return {
    ...input,
    price: input.price.toFixed(2),
    cost: input.cost.toFixed(2),
    compareAtPrice: input.compareAtPrice.toFixed(2),
  };
}

export const productsService = {
  // GETs use session cookies and API authorization, without mutation-only CSRF bootstrap.
  list: (scope: ProductScope, filters: ProductListFilters, signal: AbortSignal) =>
    read(scope, signal, async () => {
      const response = await apiClient.get(productUrl(scope), { params: filters, signal });
      return productListSchema.parse(response.data);
    }),
  get: (scope: ProductScope, id: string, signal: AbortSignal) =>
    read(scope, signal, async () => {
      const response = await apiClient.get(`${productUrl(scope)}/${id}`, { signal });
      return productResponseSchema.parse(response.data).data;
    }),
  save: (scope: ProductScope, input: ProductInput, id?: string) =>
    mutate(scope, async (url, headers) => {
      const response = id
        ? await apiClient.patch(`${url}/${id}`, serialize(input), { headers })
        : await apiClient.post(url, serialize(input), { headers });
      return productResponseSchema.parse(response.data).data;
    }),
  delete: (scope: ProductScope, id: string) =>
    mutate(scope, async (url, headers) => {
      await apiClient.delete(`${url}/${id}`, { headers });
    }),
};
