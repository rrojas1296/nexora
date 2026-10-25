"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { sessionQueryKey, useSession } from "@/features/auth/hooks/use-session";
import type { Session } from "@/features/auth/schemas/session-schema";
import { notifySessionChange } from "@/features/auth/services/session-events";
import { useSwitchBusiness } from "../hooks/use-switch-business";
import { businessInputSchema, type Business, type BusinessInput } from "../schemas/business-schema";
import { businessesService } from "../services/businesses-service";
import { BusinessFields } from "./business-fields";
import { BusinessContextField } from "./business-context-field";

export function BusinessForm({ business }: { business?: Business }) {
  const t = useTranslations("Businesses");
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const switchBusiness = useSwitchBusiness();
  const [creationId] = useState(() => crypto.randomUUID());
  const [created, setCreated] = useState<Business | null>(null);
  const [revision, setRevision] = useState(business?.revision ?? 0);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const creating = !business;
  const role = session?.memberships.find((entry) => entry.businessId === business?.id)?.role;
  const canWrite = creating || role === "OWNER" || role === "ADMIN";
  const form = useForm<BusinessInput>({
    resolver: zodResolver(businessInputSchema),
    defaultValues: {
      name: business?.name ?? "",
      description: business?.description ?? "",
      currency: business?.currency ?? "PEN",
      timezone: business?.timezone ?? "America/Lima",
      contextDraft: business?.contextDraft ?? "",
      agentName: t("defaultAgentName"),
      agentTone: "friendly",
    },
  });
  const dirty = form.formState.isDirty;
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);

  async function save(input: BusinessInput, publish: boolean) {
    setError(false);
    setSaved(false);
    try {
      if (!session || !canWrite) throw new Error("SESSION_CHANGED");
      const result = creating
        ? await businessesService.create(session.user.id, creationId, input)
        : await businessesService.save(
            { userId: session.user.id, businessId: business.id },
            input,
            revision,
            publish,
          );
      const current = queryClient.getQueryData<Session | null>(sessionQueryKey);
      if (
        current?.user.id !== session.user.id ||
        current.activeBusinessId !== session.activeBusinessId
      )
        return;
      if (creating) {
        setCreated(result);
        await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
        await switchBusiness.mutateAsync(result.id);
      } else {
        setRevision(result.revision);
        form.reset({ ...input, ...result });
        queryClient.setQueryData(["business", session.user.id, business.id], result);
        queryClient.setQueryData<Session>(sessionQueryKey, {
          ...current,
          memberships: current.memberships.map((entry) =>
            entry.businessId === result.id
              ? { ...entry, business: { id: result.id, name: result.name, slug: result.slug } }
              : entry,
          ),
        });
        notifySessionChange();
        setSaved(true);
      }
    } catch {
      setError(true);
    }
  }
  const busy = form.formState.isSubmitting || switchBusiness.isPending;
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((input) => save(input, false))}
      aria-busy={busy}
      className="space-y-6 rounded-3xl border bg-card p-5 sm:p-8"
    >
      <fieldset disabled={busy || !canWrite || !!created} className="space-y-6">
        <legend className="sr-only">{t(creating ? "create" : "configuration")}</legend>
        <BusinessFields form={form} creating={creating} disabled={busy || !canWrite} />
        <BusinessContextField form={form} disabled={busy || !canWrite} />
        {Object.keys(form.formState.errors).length ? (
          <p role="alert" className="text-xs text-destructive">
            {t("invalid")}
          </p>
        ) : null}
        {!creating ? (
          <p className="text-xs leading-6 text-muted-foreground">
            {t("publication", { version: business.contextVersion })}
          </p>
        ) : (
          <p className="text-xs leading-6 text-muted-foreground">{t("creationNotice")}</p>
        )}
        {!canWrite ? <p className="text-xs text-muted-foreground">{t("readOnly")}</p> : null}
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          <Button asChild variant="outline">
            <Link href="/businesses">{t("back")}</Link>
          </Button>
          {!creating ? (
            <Button
              variant="outline"
              disabled={!canWrite}
              onClick={form.handleSubmit((input) => save(input, true))}
            >
              {t("publish")}
            </Button>
          ) : null}
          <Button type="submit" disabled={!canWrite}>
            {t(busy ? "saving" : creating ? "create" : "saveDraft")}
          </Button>
        </div>
      </fieldset>
      {error ? (
        <p role="alert" className="text-xs leading-6 text-destructive">
          {t(created ? "activationError" : "saveError")}
        </p>
      ) : null}
      {created ? (
        <Button
          onClick={() => switchBusiness.mutate(created.id)}
          disabled={switchBusiness.isPending}
        >
          {t("open")}
        </Button>
      ) : null}
      {saved && !dirty ? (
        <output className="block text-xs text-primary">{t("saved")}</output>
      ) : null}
    </form>
  );
}
