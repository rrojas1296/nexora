"use client";

import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input-field";
import { useDemoScenarioStore } from "../stores/demo-scenario-store";
import { resetMockWorkspace } from "../services/workspace-service";
import { workspaceQueryKey } from "../hooks/use-workspace";
import { useState } from "react";

const scenarios = ["normal", "empty", "error"] as const;
export function DemoToolbar() {
  const t = useTranslations("Demo");
  const scenario = useDemoScenarioStore((state) => state.scenario);
  const setScenario = useDemoScenarioStore((state) => state.setScenario);
  const client = useQueryClient();
  const busy = useIsMutating({ mutationKey: workspaceQueryKey }) > 0;
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <section
      aria-label={t("controls")}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-secondary/30 px-4 py-3"
    >
      <p className="max-w-xl text-xs leading-5 text-muted-foreground">{t("notice")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs" htmlFor="demo-scenario">
          {t("scenario")}
        </label>
        <select
          id="demo-scenario"
          className={`${fieldClassName} w-auto py-1.5 text-xs`}
          value={scenario}
          disabled={busy}
          onChange={(event) => {
            const next = scenarios.find((value) => value === event.target.value);
            if (next) setScenario(next);
          }}
        >
          {scenarios.map((value) => (
            <option key={value} value={value}>
              {t(`scenarios.${value}`)}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmReset(true)}>
          {t("reset")}
        </Button>
      </div>
      {scenario === "empty" ? (
        <p className="w-full text-xs text-muted-foreground">{t("emptyReadOnly")}</p>
      ) : null}
      {confirmReset ? (
        <div className="flex w-full flex-wrap items-center gap-3 border-t pt-3">
          <p className="flex-1 text-xs">{t("resetConfirm")}</p>
          <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              await client.cancelQueries({ queryKey: workspaceQueryKey });
              resetMockWorkspace();
              setScenario("normal");
              await client.invalidateQueries({ queryKey: workspaceQueryKey });
              useDemoScenarioStore.getState().bumpRevision();
              setConfirmReset(false);
            }}
          >
            {t("confirmReset")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
