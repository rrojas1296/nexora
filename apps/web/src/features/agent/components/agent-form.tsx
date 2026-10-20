"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Bot } from "lucide-react";
import { agentSchema, tones } from "@/features/demo/schemas/workspace-schema";
import type { Agent } from "@/features/demo/types/workspace";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { useDemoScenarioStore } from "@/features/demo/stores/demo-scenario-store";
import { RecordForm } from "@/features/demo/components/record-form";

export function AgentForm({ agent }: { agent: Agent }) {
  const t = useTranslations("Agent");
  const mutation = useWorkspaceMutation();
  const readOnly = useDemoScenarioStore((state) => state.scenario !== "normal");
  const form = useForm<Agent>({ resolver: zodResolver(agentSchema), defaultValues: agent });
  const preview = useWatch({ control: form.control });
  return (
    <div className="grid items-start gap-6 xl:grid-cols-5">
      <section className="min-w-0 rounded-3xl border bg-card p-6 xl:col-span-3">
        <h2 className="mb-5 text-lg">{t("configuration")}</h2>
        <RecordForm
          form={form}
          pending={mutation.isPending}
          readOnly={readOnly}
          error={mutation.error}
          success={mutation.isSuccess && !form.formState.isDirty}
          fields={[
            { name: "name", label: t("name") },
            {
              name: "tone",
              label: t("tone"),
              kind: "select",
              options: tones.map((value) => ({ value, label: t(`tones.${value}`) })),
            },
            { name: "instructions", label: t("instructions"), kind: "textarea" },
            { name: "greeting", label: t("greeting"), kind: "textarea", maxLength: 300 },
            { name: "enabled", label: t("enabled"), kind: "checkbox" },
          ]}
          onSave={async (input) => {
            try {
              await mutation.mutateAsync({ type: "agent.save", input });
              form.reset(input);
            } catch {
              /* Preserve the configuration draft. */
            }
          }}
        />
      </section>
      <aside className="min-w-0 rounded-3xl border bg-secondary/30 p-6 xl:col-span-2">
        <span className="flex size-12 items-center justify-center rounded-full border bg-card">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg">{t("preview")}</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("previewHint")}</p>
        <div className="mt-6 rounded-2xl border bg-card p-4">
          <p className="break-words text-xs font-medium">{preview.name || t("name")}</p>
          <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6">
            {preview.greeting || "—"}
          </p>
          <span className="mt-4 inline-block rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
            {t(`tones.${preview.tone ?? "friendly"}`)}
          </span>
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          {t(preview.enabled ? "enabledHint" : "disabledHint")}
        </p>
      </aside>
    </div>
  );
}
