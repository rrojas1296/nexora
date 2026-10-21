"use client";

import { apiClient } from "@/lib/api/client";
import { withAuthenticatedSession } from "@/features/auth/services/auth-service";
import {
  productListSchema,
  productResponseSchema,
  type ProductInput,
  type ProductListFilters,
  type ProductScope,
} from "../schemas/product-schema";

function authenticated<T>(
  scope: ProductScope,
  operation: (url: string, headers: Record<string, string>) => Promise<T>,
  signal?: AbortSignal,
) {
  return withAuthenticatedSession(async (session, headers) => {
    signal?.throwIfAborted();
    if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
      throw new Error("SESSION_CHANGED");
    return operation(`/businesses/${scope.businessId}/products`, headers);
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
  list: (scope: ProductScope, filters: ProductListFilters, signal: AbortSignal) =>
    authenticated(
      scope,
      async (url) => {
        const response = await apiClient.get(url, { params: filters, signal });
        return productListSchema.parse(response.data);
      },
      signal,
    ),
  get: (scope: ProductScope, id: string, signal: AbortSignal) =>
    authenticated(
      scope,
      async (url) => {
        const response = await apiClient.get(`${url}/${id}`, { signal });
        return productResponseSchema.parse(response.data).data;
      },
      signal,
    ),
  save: (scope: ProductScope, input: ProductInput, id?: string) =>
    authenticated(scope, async (url, headers) => {
      const response = id
        ? await apiClient.patch(`${url}/${id}`, serialize(input), { headers })
        : await apiClient.post(url, serialize(input), { headers });
      return productResponseSchema.parse(response.data).data;
    }),
  delete: (scope: ProductScope, id: string) =>
    authenticated(scope, async (url, headers) => {
      await apiClient.delete(`${url}/${id}`, { headers });
    }),
};
