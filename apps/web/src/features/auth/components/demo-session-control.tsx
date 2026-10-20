"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding-store";
import { useDemoSessionStore } from "../stores/demo-session-store";
import { resetDemoData } from "@/features/demo/lib/reset-demo-data";

export function DemoSessionControl() {
  const t = useTranslations("Auth");
  const session = useDemoSessionStore((state) => state.session);
  const router = useRouter();
  const queryClient = useQueryClient();
  if (!session)
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center gap-2 rounded-full border bg-card/60 px-3 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogIn className="size-3.5" aria-hidden="true" />
        {t("loginAction")}
      </Link>
    );
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-full border bg-card/60 pl-3">
      <Link
        href="/onboarding"
        title={t("demoAccount")}
        className="flex items-center gap-2 rounded text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserRound className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="max-w-24 truncate">{session.name}</span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("logout")}
        title={t("logout")}
        onClick={() => {
          useDemoSessionStore.getState().endSession();
          useOnboardingStore.getState().reset();
          resetDemoData();
          queryClient.clear();
          router.push("/login");
        }}
      >
        <LogOut className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
