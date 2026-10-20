import { Check, CircleDashed, Layers2, Unplug } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function WorkspaceStatus() {
  const t = await getTranslations("Workspace");
  const items = [
    { label: "interface", value: "ready", icon: Check, tone: "bg-accent text-accent-foreground" },
    {
      label: "business",
      value: "planned",
      icon: Layers2,
      tone: "bg-secondary text-secondary-foreground",
    },
    {
      label: "whatsapp",
      value: "disconnected",
      icon: Unplug,
      tone: "bg-muted text-muted-foreground",
    },
    {
      label: "backend",
      value: "notConnected",
      icon: CircleDashed,
      tone: "bg-muted text-muted-foreground",
    },
  ] as const;
  return (
    <section aria-label={t("statusTitle")}>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-2xl border bg-card/70 px-4 py-4"
          >
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{t(label)}</dt>
              <dd className="mt-2 text-base font-medium tracking-tight">{t(value)}</dd>
            </div>
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`}
            >
              <Icon className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </span>
          </div>
        ))}
      </dl>
    </section>
  );
}
