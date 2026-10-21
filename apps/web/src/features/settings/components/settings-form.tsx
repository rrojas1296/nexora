"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { settingsSchema } from "@/features/demo/schemas/workspace-schema";
import type { Settings } from "@/features/demo/types/workspace";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { useDemoScenarioStore } from "@/features/demo/stores/demo-scenario-store";
import { RecordForm } from "@/features/demo/components/record-form";
import { ThemeSelect } from "@/components/layout/theme-select";
import { LocaleSelect } from "@/components/layout/locale-select";

export function SettingsForm({ settings }: { settings: Settings }) {
  const t = useTranslations("Settings");
  const mutation = useWorkspaceMutation();
  const readOnly = useDemoScenarioStore((state) => state.scenario !== "normal");
  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  return (
    <div className="grid items-start gap-6 xl:grid-cols-5">
      <section className="min-w-0 rounded-3xl border bg-card p-6 xl:col-span-3">
        <h2 className="mb-5 text-lg">{t("business")}</h2>
        <RecordForm
          form={form}
          pending={mutation.isPending}
          readOnly={readOnly}
          error={mutation.error}
          success={mutation.isSuccess && !form.formState.isDirty}
          fields={[
            { name: "businessName", label: t("businessName") },
            { name: "email", label: t("email"), kind: "email", maxLength: 254 },
            {
              name: "weekStart",
              label: t("weekStart"),
              kind: "select",
              options: ["monday", "sunday"].map((value) => ({
                value,
                label: t(value === "monday" ? "monday" : "sunday"),
              })),
            },
            { name: "notifications", label: t("notifications"), kind: "checkbox" },
          ]}
          onSave={async (input) => {
            try {
              await mutation.mutateAsync({ type: "settings.save", input });
              form.reset(input);
            } catch {
              /* Preserve the settings draft. */
            }
          }}
        />
      </section>
      <aside className="min-w-0 space-y-5 xl:col-span-2">
        <section className="rounded-3xl border bg-card p-6">
          <h2 className="text-lg">{t("preferences")}</h2>
          <p className="mt-2 mb-5 text-xs leading-6 text-muted-foreground">
            {t("preferencesHint")}
          </p>
          <div className="flex flex-wrap gap-3">
            <ThemeSelect />
            <LocaleSelect />
          </div>
        </section>
      </aside>
    </div>
  );
}
