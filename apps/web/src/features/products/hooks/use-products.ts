"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, sessionQueryKey } from "@/features/auth/hooks/use-session";
import type { Session } from "@/features/auth/schemas/session-schema";
import { productsService } from "../services/products-service";
import {
  productSchema,
  type ProductInput,
  type ProductListFilters,
  type ProductScope,
} from "../schemas/product-schema";

export function useProductAccess() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const scope: ProductScope | null = session
    ? { userId: session.user.id, businessId: session.activeBusinessId }
    : null;
  const role = session?.memberships.find(
    (membership) => membership.businessId === scope?.businessId,
  )?.role;
  return {
    scope,
    canWrite: role === "OWNER" || role === "ADMIN",
    isCurrent: () => {
      const current = queryClient.getQueryData<Session | null>(sessionQueryKey);
      return (
        !!scope &&
        current?.user.id === scope.userId &&
        current.activeBusinessId === scope.businessId
      );
    },
  };
}

function productKey(scope: ProductScope | null) {
  return ["products", scope?.userId, scope?.businessId] as const;
}

export function useProducts(filters: ProductListFilters) {
  const { scope } = useProductAccess();
  return useQuery({
    queryKey: [...productKey(scope), "list", filters],
    queryFn: ({ signal }) => {
      if (!scope) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
      return productsService.list(scope, filters, signal);
    },
    enabled: !!scope,
    retry: false,
    staleTime: 10_000,
  });
}

export function useProduct(id?: string) {
  const { scope } = useProductAccess();
  const validId = productSchema.shape.id.safeParse(id).success;
  const query = useQuery({
    queryKey: [...productKey(scope), "detail", id],
    queryFn: ({ signal }) => {
      if (!scope || !id) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
      return productsService.get(scope, id, signal);
    },
    enabled: !!scope && validId,
    retry: false,
  });
  return { ...query, validId };
}

type ProductCommand =
  | { type: "save"; input: ProductInput; id?: string }
  | { type: "delete"; id: string };

export function useProductMutation() {
  const { scope, canWrite, isCurrent } = useProductAccess();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...productKey(scope), "write"],
    mutationFn: async (command: ProductCommand) => {
      if (!scope || !canWrite) throw new Error("PRODUCT_FORBIDDEN");
      return command.type === "delete"
        ? productsService.delete(scope, command.id)
        : productsService.save(scope, command.input, command.id);
    },
    retry: false,
    onSettled: async () => {
      // Even a lost response may have committed. Reconcile reads, never replay writes.
      if (!isCurrent()) return;
      const queryKey = productKey(scope);
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
