"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WhatsappScope } from "../schemas/whatsapp-schema";
import { whatsappService } from "../services/whatsapp-service";

export function useWhatsappConnection(scope: WhatsappScope) {
  const queryClient = useQueryClient();
  const queryKey = ["whatsapp-connection", scope.userId, scope.businessId];
  const connection = useQuery({
    queryKey,
    queryFn: ({ signal }) => whatsappService.connection(scope, signal),
    retry: false,
  });
  const reconcile = () => queryClient.invalidateQueries({ queryKey });
  const disconnect = useMutation({
    mutationFn: () => whatsappService.disconnect(scope),
    retry: false,
    onSettled: reconcile,
  });
  return { connection, disconnect, reconcile };
}
