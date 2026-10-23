"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { MessageCircle, Unplug } from "lucide-react";
import {
  authorizationSelectionSchema,
  type AuthorizationSelection,
  type WhatsappScope,
} from "../schemas/whatsapp-schema";
import { useWhatsappConnection } from "../hooks/use-whatsapp-connection";
import { useWhatsappAuthorization } from "../hooks/use-whatsapp-authorization";
import { whatsappErrorKey } from "../services/whatsapp-error";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function WhatsappConnectionPanel({ scope }: { scope: WhatsappScope }) {
  const t = useTranslations("WhatsappConnection");
  const { connection, disconnect, reconcile } = useWhatsappConnection(scope);
  const authorization = useWhatsappAuthorization(scope, reconcile);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const form = useForm<AuthorizationSelection>({
    resolver: zodResolver(authorizationSelectionSchema),
    defaultValues: { phoneNumberId: "" },
  });
  const busy =
    authorization.start.isPending || authorization.complete.isPending || disconnect.isPending;
  const saved = connection.data;
  const attempt = authorization.attempt.data;
  const rawError =
    authorization.start.error ??
    authorization.complete.error ??
    disconnect.error ??
    connection.error ??
    authorization.attempt.error;
  const needsReview =
    !saved &&
    (authorization.callbackFailed || (attempt && !["READY", "CONNECTED"].includes(attempt.status)));

  return (
    <div className="mt-5 space-y-4">
      {connection.isPending ? (
        <output className="block text-sm text-muted-foreground">{t("loading")}</output>
      ) : null}
      {saved ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
          <div>
            <p className="text-sm font-medium">{saved.verifiedName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{saved.displayPhoneNumber}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("connectedHint")}</p>
          </div>
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() => setConfirmDisconnect(true)}
          >
            <Unplug className="size-4" aria-hidden="true" />
            {t("disconnect")}
          </button>
        </div>
      ) : connection.isSuccess ? (
        <div className="max-w-2xl space-y-4">
          <p className="text-sm">{t("notConnected")}</p>
          <p className="text-xs leading-6 text-muted-foreground">{t("requirements")}</p>
          {attempt?.status === "READY" ? (
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit(({ phoneNumberId }) => {
                const asset = attempt.assets.find((entry) => entry.phoneNumberId === phoneNumberId);
                if (asset) authorization.complete.mutate({ phoneNumberId, wabaId: asset.wabaId });
              })}
            >
              <label htmlFor="whatsapp-number" className="block text-sm">
                {t("selectNumber")}
              </label>
              <select
                id="whatsapp-number"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                disabled={busy}
                aria-invalid={!!form.formState.errors.phoneNumberId}
                aria-describedby="whatsapp-number-error"
                {...form.register("phoneNumberId")}
              >
                <option value="">{t("selectNumber")}</option>
                {attempt.assets.map((asset) => (
                  <option key={asset.phoneNumberId} value={asset.phoneNumberId}>
                    {asset.displayPhoneNumber} — {asset.verifiedName}
                  </option>
                ))}
              </select>
              <p id="whatsapp-number-error" role="alert" className="text-xs text-destructive">
                {form.formState.errors.phoneNumberId ? t("selectNumber") : null}
              </p>
              <button type="submit" className={buttonClass} disabled={busy}>
                {t("confirmNumber")}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={buttonClass}
              disabled={
                busy ||
                connection.isFetching ||
                (authorization.hasAttempt && authorization.attempt.isFetching)
              }
              onClick={() => authorization.start.mutate()}
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("connect")}
            </button>
          )}
          <p className="text-xs leading-6 text-muted-foreground">{t("privacy")}</p>
        </div>
      ) : null}
      {confirmDisconnect && saved ? (
        <div className="space-y-3 rounded-2xl border p-4">
          <p className="text-sm">{t("disconnectHint")}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() =>
                disconnect.mutate(undefined, { onSuccess: () => setConfirmDisconnect(false) })
              }
            >
              {t("confirmDisconnect")}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => setConfirmDisconnect(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}
      <output aria-live="polite" className="block text-sm text-muted-foreground">
        {authorization.start.isPending ? t("preparing") : null}
        {authorization.complete.isPending ? t("saving") : null}
        {attempt?.status === "CONNECTED" && saved ? t("success") : null}
      </output>
      {rawError || needsReview ? (
        <p role="alert" className="max-w-2xl text-sm leading-6 text-destructive">
          {t(`errors.${rawError ? whatsappErrorKey(rawError) : "uncertain"}`)}
        </p>
      ) : null}
      <button
        type="button"
        className={buttonClass}
        disabled={busy || connection.isFetching}
        onClick={() => {
          void connection.refetch();
          if (authorization.hasAttempt) void authorization.attempt.refetch();
        }}
      >
        {t("refresh")}
      </button>
    </div>
  );
}
