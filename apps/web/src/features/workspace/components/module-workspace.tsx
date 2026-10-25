import { PageEntrance } from "@/components/ui/page-entrance";
import { getTranslations } from "next-intl/server";
import type { ModuleKey } from "@/components/layout/navigation";
import { DemoToolbar } from "@/features/demo/components/demo-toolbar";
import { DemoContent } from "@/features/demo/components/demo-content";
import { ModuleContent } from "./module-content";
import { SetupCard } from "./setup-card";

export async function ModuleWorkspace({ module }: { module: ModuleKey }) {
  const [nav, t, dashboard, products, agent, inbox] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Demo"),
    getTranslations("Dashboard"),
    getTranslations("Products"),
    getTranslations("Agent"),
    getTranslations("WhatsappInbox"),
  ]);
  const persisted =
    module === "products" ||
    module === "agent" ||
    module === "conversations" ||
    module === "businesses";
  return (
    <PageEntrance key={module} className="w-full space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-xs tracking-widest text-muted-foreground uppercase">
            {module === "products"
              ? products("eyebrow")
              : module === "agent"
                ? agent("eyebrow")
                : module === "conversations"
                  ? inbox("eyebrow")
                  : t("eyebrow")}
          </p>
          <h1
            id="module-title"
            tabIndex={-1}
            className="text-3xl font-normal tracking-tight outline-none sm:text-4xl"
          >
            {nav(module)}
          </h1>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-muted-foreground">
            {module === "products"
              ? products("workspaceDescription")
              : module === "agent"
                ? agent("workspaceDescription")
                : t(`descriptions.${module}`)}
          </p>
        </div>
      </header>
      {module === "dashboard" ? (
        <details className="rounded-xl border border-dashed px-4 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer">{dashboard("demoControls")}</summary>
          <div className="mt-3">
            <DemoToolbar />
          </div>
        </details>
      ) : module !== "help" && !persisted ? (
        <DemoToolbar />
      ) : null}
      {persisted ? (
        <ModuleContent module={module} />
      ) : (
        <DemoContent>
          <ModuleContent module={module} />
        </DemoContent>
      )}
      {module === "dashboard" ? <SetupCard /> : null}
    </PageEntrance>
  );
}
