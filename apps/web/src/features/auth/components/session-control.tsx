"use client";

import { useState } from "react";
import { KeyRound, LogOut, MonitorX, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthError } from "../hooks/use-auth-error";
import { sessionQueryKey, useSession } from "../hooks/use-session";
import { authService } from "../services/auth-service";
import { resetSessionData } from "../services/reset-session-data";
import { notifySessionChange } from "../services/session-events";

export function SessionControl() {
  const t = useTranslations("Auth");
  const security = useTranslations("PasswordChange");
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useAuthError();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!session) return null;

  async function logout(all = false) {
    setBusy(true);
    setError("");
    try {
      await authService.logout(all);
      await queryClient.cancelQueries({ queryKey: sessionQueryKey });
      resetSessionData(queryClient);
      queryClient.setQueryData(sessionQueryKey, null);
      notifySessionChange();
      router.replace("/login");
      router.refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <div
        className="flex min-w-0 items-center gap-1 rounded-full border bg-card/60 pl-3"
        aria-busy={busy}
      >
        <Link
          href="/businesses"
          title={t("account")}
          className="flex items-center gap-2 rounded text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserRound className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="max-w-24 truncate">{session.user.name}</span>
        </Link>
        <Link
          href="/settings/password"
          title={security("title")}
          aria-label={security("title")}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <KeyRound className="size-3.5" aria-hidden="true" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          aria-label={t("logout")}
          title={t("logout")}
          onClick={() => {
            void logout();
          }}
        >
          <LogOut className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          aria-label={t("logoutAll")}
          title={t("logoutAll")}
          onClick={() => {
            void logout(true);
          }}
        >
          <MonitorX className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      {error ? (
        <p role="alert" className="max-w-64 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
