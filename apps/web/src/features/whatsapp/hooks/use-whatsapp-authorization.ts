"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { sessionQueryKey } from "@/features/auth/hooks/use-session";
import type { Session } from "@/features/auth/schemas/session-schema";
import type { WhatsappScope } from "../schemas/whatsapp-schema";
import { whatsappService } from "../services/whatsapp-service";

export function useWhatsappAuthorization(scope: WhatsappScope, reconcile: () => Promise<void>) {
  const locale = useLocale();
  const search = useSearchParams();
  const id = z.uuid().safeParse(search.get("whatsappAttempt"));
  const attemptId = id.success ? id.data : null;
  const client = useQueryClient();
  const current = () => {
    const session = client.getQueryData<Session | null>(sessionQueryKey);
    return session?.user.id === scope.userId && session.activeBusinessId === scope.businessId;
  };
  const attempt = useQuery({
    queryKey: ["whatsapp-authorization", scope.userId, scope.businessId, attemptId],
    enabled: !!attemptId,
    queryFn: ({ signal }) => whatsappService.attempt(scope, attemptId!, signal),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const start = useMutation({
    mutationFn: () => whatsappService.start(scope, locale),
    retry: false,
    onSuccess: (destination) => {
      if (current()) window.location.assign(destination);
    },
  });
  const complete = useMutation({
    mutationFn: (asset: { phoneNumberId: string; wabaId: string }) => {
      if (!attemptId) throw new Error("SESSION_CHANGED");
      return whatsappService.complete(scope, { attemptId, ...asset });
    },
    retry: false,
    onSettled: async () => {
      if (!current()) return;
      await Promise.all([
        reconcile(),
        client.invalidateQueries({
          queryKey: ["whatsapp-authorization", scope.userId, scope.businessId, attemptId],
        }),
      ]);
    },
  });
  return {
    start,
    attempt,
    complete,
    callbackFailed: search.get("whatsappResult") === "failed",
    hasAttempt: !!attemptId,
  };
}
