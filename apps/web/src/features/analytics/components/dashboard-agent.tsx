"use client";

import { Bot, SlidersHorizontal } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/features/demo/types/workspace";

export function DashboardAgent({ workspace }: { workspace: Workspace }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const assigned = workspace.conversations.filter(
    (row) => row.assignedTo === "agent" && row.status !== "closed",
  ).length;
  return (
    <section className="rounded-3xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-medium">{t("yourAgent")}</h2>
        <span className="rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
          {workspace.agent.enabled ? t("enabledDemo") : t("pausedDemo")}
        </span>
      </div>
      <div className="my-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{workspace.agent.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("agentHint")}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-background px-3 py-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{t("assigned")}</span>
          <span className="tabular-nums">{format.number(assigned)}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("agentScope")}</p>
      </div>
      <Button asChild size="sm" className="mt-4 w-full">
        <Link href="/agent">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("configureAgent")}
        </Link>
      </Button>
    </section>
  );
}
