import { SlidersHorizontal } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SetupCard } from "./setup-card";
import { ConnectionFlow } from "./connection-flow";
import { WorkspaceModules } from "./workspace-modules";
import { WorkspaceStatus } from "./workspace-status";

export async function WorkspaceOverview() {
  const t = await getTranslations("Workspace");
  const common = await getTranslations("Common");
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <h1 className="text-sm font-normal text-muted-foreground">{t("title")}</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-secondary-foreground" aria-hidden="true" />
          {common("demo")}
        </span>
      </div>
      <WorkspaceStatus />
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="min-w-0 rounded-3xl border bg-card/70 p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("stage")}</p>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
              {t("planned")}
            </span>
          </div>
          <h2 className="mt-6 max-w-sm text-3xl leading-tight font-normal tracking-tight sm:text-4xl">
            {t("welcome")}
          </h2>
          <p className="mt-3 max-w-xl text-xs leading-6 text-muted-foreground">
            {t("welcomeDescription")}
          </p>
          <ConnectionFlow />
        </section>
        <div className="flex flex-col gap-4">
          <SetupCard />
          <section className="rounded-3xl border bg-secondary/40 p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="size-3.5 text-secondary-foreground"
                aria-hidden="true"
              />
              <h2 className="text-xs font-medium">{t("preferencesTitle")}</h2>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t("preferencesDescription")}
            </p>
          </section>
        </div>
      </div>
      <WorkspaceModules />
    </>
  );
}
