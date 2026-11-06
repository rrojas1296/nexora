"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import { commerceService } from "@/features/commerce/services/commerce-service";
export function useClientAddresses(clientId: string) {
  const { scope } = useCommerceAccess();
  return useQuery({
    queryKey: ["clients", scope?.userId, scope?.businessId, clientId, "addresses"],
    queryFn: ({ signal }) => {
      if (!scope) throw new Error("SESSION_CHANGED");
      return commerceService.addresses(scope, clientId, signal);
    },
    enabled: !!scope && z.uuid().safeParse(clientId).success,
    retry: false,
    refetchInterval: 10_000,
  });
}
export function useAddressMutation(clientId: string) {
  const { scope, canWrite, isCurrent } = useCommerceAccess();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, remove }: { id?: string; input: unknown; remove?: boolean }) => {
      if (!scope || !canWrite || !isCurrent()) throw new Error("COMMERCE_FORBIDDEN");
      return commerceService.saveAddress(scope, clientId, input, id, remove);
    },
    retry: false,
    onSettled: async () => {
      if (!scope || !isCurrent()) return;
      const queryKey = ["clients", scope.userId, scope.businessId];
      await cache.cancelQueries({ queryKey });
      await cache.invalidateQueries({ queryKey });
    },
  });
}
