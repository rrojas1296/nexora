"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Bot } from "lucide-react";
import {
  agentInputSchema,
  emptyAgent,
  type AgentConfiguration,
  type AgentInput,
} from "../schemas/agent-schema";
import { useAgentAccess, useAgentMutation } from "../hooks/use-agent";
import { agentErrorKey } from "../services/agent-error";
import { Button } from "@/components/ui/button";
import { MutationNotice } from "@/features/demo/components/mutation-notice";
import { AgentFields } from "./agent-fields";

export function AgentForm({ agent }: { agent: AgentConfiguration | null }) {
  const t = useTranslations("Agent");
  const common = useTranslations("Demo");
  const mutation = useAgentMutation();
  const access = useAgentAccess();
  const form = useForm<AgentInput>({
    resolver: zodResolver(agentInputSchema),
    defaultValues: agent ?? emptyAgent,
  });
  const { isDirty } = form.formState;
  useEffect(() => {
    // Background reconciliation must not overwrite an unsaved draft.
    if (!isDirty && !mutation.isPending) form.reset(agent ?? emptyAgent);
  }, [agent, form, isDirty, mutation.isPending]);
  const preview = useWatch({ control: form.control });
  return (
    <div className="grid items-start gap-6 xl:grid-cols-5">
      <section className="min-w-0 rounded-3xl border bg-card p-6 xl:col-span-3">
        <h2 className="mb-5 text-lg">{t("configuration")}</h2>
        <form
          noValidate
          aria-busy={mutation.isPending}
          onSubmit={form.handleSubmit(async (input) => {
            try {
              const saved = await mutation.mutateAsync(input);
              if (access.isCurrent()) form.reset(saved);
            } catch {
              /* Preserve the configuration draft. */
            }
          })}
        >
          <fieldset disabled={mutation.isPending || !access.canWrite} className="space-y-5">
            <legend className="sr-only">{t("configuration")}</legend>
            {Object.keys(form.formState.errors).length > 0 ? (
              <p role="alert" className="text-xs text-destructive">
                {t("validationBlocked")}
              </p>
            ) : null}
            <AgentFields form={form} disabled={mutation.isPending || !access.canWrite} />
            <MutationNotice
              error={mutation.error}
              message={
                mutation.error ? t(`errors.${agentErrorKey(mutation.error, true)}`) : undefined
              }
              success={mutation.isSuccess && !isDirty}
            />
            <div className="flex justify-end border-t pt-5">
              <Button type="submit">{common(mutation.isPending ? "saving" : "save")}</Button>
            </div>
          </fieldset>
        </form>
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
