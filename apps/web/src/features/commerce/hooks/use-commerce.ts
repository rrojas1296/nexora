"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useSession, sessionQueryKey } from "@/features/auth/hooks/use-session";
import type { Session } from "@/features/auth/schemas/session-schema";
import type { CommerceFilters, CommerceScope } from "../schemas/commerce-schema";
import { commerceService } from "../services/commerce-service";
export function useCommerceAccess() {
  const { data: session } = useSession();
  const cache = useQueryClient();
  const scope: CommerceScope | null = session?.activeBusinessId
    ? { userId: session.user.id, businessId: session.activeBusinessId }
    : null;
  const role = session?.memberships.find((member) => member.businessId === scope?.businessId)?.role;
  return {
    scope,
    canWrite: role === "OWNER" || role === "ADMIN",
    isCurrent: () => {
      const current = cache.getQueryData<Session | null>(sessionQueryKey);
      return (
        !!scope &&
        current?.user.id === scope.userId &&
        current.activeBusinessId === scope.businessId
      );
    },
  };
}
function key(resource: string, scope: CommerceScope | null) {
  return [resource, scope?.userId, scope?.businessId] as const;
}
export function useClients(filters: CommerceFilters) {
  const { scope } = useCommerceAccess();
  return useQuery({
    queryKey: [...key("clients", scope), "list", filters],
    queryFn: ({ signal }) => {
      if (!scope) throw new Error("SESSION_CHANGED");
      return commerceService.clients(scope, filters, signal);
    },
    enabled: !!scope,
    retry: false,
    refetchInterval: 10_000,
  });
}
export function useOrders(filters: CommerceFilters) {
  const { scope } = useCommerceAccess();
  return useQuery({
    queryKey: [...key("orders", scope), "list", filters],
    queryFn: ({ signal }) => {
      if (!scope) throw new Error("SESSION_CHANGED");
      return commerceService.orders(scope, filters, signal);
    },
    enabled: !!scope,
    retry: false,
    refetchInterval: 10_000,
  });
}
export function useClient(id?: string) {
  const { scope } = useCommerceAccess();
  const valid = z.uuid().safeParse(id).success;
  return useQuery({
    queryKey: [...key("clients", scope), "detail", id],
    queryFn: ({ signal }) => {
      if (!scope || !id) throw new Error("SESSION_CHANGED");
      return commerceService.client(scope, id, signal);
    },
    enabled: !!scope && valid,
    retry: false,
  });
}
export function useOrder(id?: string) {
  const { scope } = useCommerceAccess();
  const valid = z.uuid().safeParse(id).success;
  return useQuery({
    queryKey: [...key("orders", scope), "detail", id],
    queryFn: ({ signal }) => {
      if (!scope || !id) throw new Error("SESSION_CHANGED");
      return commerceService.order(scope, id, signal);
    },
    enabled: !!scope && valid,
    retry: false,
  });
}
export function useCommerceMutation(resource: "clients" | "orders") {
  const { scope, canWrite, isCurrent } = useCommerceAccess();
  const cache = useQueryClient();
  return useMutation({
    mutationKey: [...key(resource, scope), "write"],
    mutationFn: ({ id, input }: { id?: string; input: unknown }) => {
      if (!scope || !canWrite || !isCurrent()) throw new Error("COMMERCE_FORBIDDEN");
      return commerceService.save(scope, resource, input, id);
    },
    retry: false,
    onSettled: async () => {
      if (!isCurrent()) return;
      await Promise.all(
        ["clients", "orders", "whatsapp-inbox"].map(async (name) => {
          const queryKey = key(name, scope);
          await cache.cancelQueries({ queryKey });
          await cache.invalidateQueries({ queryKey });
        }),
      );
    },
  });
}
