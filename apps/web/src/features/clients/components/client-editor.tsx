"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { clientCountries, clientInputSchema, clientSegments } from "../schemas/client-schema";
import type { Client, ClientInput } from "../schemas/client-schema";
import { useCommerceAccess, useCommerceMutation } from "@/features/commerce/hooks/use-commerce";
import { commerceErrorKey } from "@/features/commerce/services/commerce-error";
import { RecordForm } from "@/features/demo/components/record-form";

export function ClientEditor({ client, onClose }: { client?: Client; onClose: () => void }) {
  const t = useTranslations("Clients");
  const c = useTranslations("Commerce");
  const { canWrite, isCurrent } = useCommerceAccess();
  const mutation = useCommerceMutation("clients");
  const creationId = useRef<string | null>(null);
  const version = useRef(client?.version);
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientInputSchema),
    defaultValues: client
      ? { ...client, email: client.email ?? "", country: client.country ?? "none" }
      : {
          name: "",
          email: "",
          phone: "",
          notes: "",
          company: "",
          taxId: "",
          segment: "retail",
          active: true,
          address: "",
          city: "",
          region: "",
          postalCode: "",
          country: "none",
          language: "es",
          marketingConsent: false,
        },
  });
  return (
    <RecordForm
      form={form}
      columns
      pending={mutation.isPending}
      error={mutation.error}
      errorMessage={c(commerceErrorKey(mutation.error))}
      validationMessage={c("validation")}
      readOnly={!canWrite}
      onCancel={onClose}
      fields={[
        { name: "name", label: t("name"), maxLength: 160, section: t("contact") },
        { name: "email", label: t("email"), kind: "email", maxLength: 254 },
        { name: "phone", label: t("phone"), kind: "tel", maxLength: 21, hint: c("phoneHint") },
        { name: "company", label: t("company"), maxLength: 160 },
        { name: "taxId", label: t("taxId"), maxLength: 80 },
        {
          name: "segment",
          label: t("segment"),
          kind: "select",
          options: clientSegments.map((value) => ({ value, label: t(`segments.${value}`) })),
        },
        { name: "address", label: t("address"), maxLength: 500, section: t("shipping") },
        { name: "city", label: t("city") },
        { name: "region", label: t("region") },
        { name: "postalCode", label: t("postalCode"), maxLength: 32 },
        {
          name: "country",
          label: t("country"),
          kind: "select",
          options: [
            { value: "none", label: c("unknown") },
            ...clientCountries.map((value) => ({
              value,
              label: t.has(`countries.${value}`) ? t(`countries.${value}`) : value,
            })),
            ...(client?.country && !(clientCountries as readonly string[]).includes(client.country)
              ? [{ value: client.country, label: client.country }]
              : []),
          ],
        },
        {
          name: "language",
          label: t("language"),
          section: t("preferences"),
          kind: "select",
          options: [
            { value: "es", label: "Español" },
            { value: "en", label: "English" },
          ],
        },
        { name: "active", label: t("active"), kind: "checkbox" },
        { name: "marketingConsent", label: t("marketingConsent"), kind: "checkbox" },
        { name: "notes", label: t("notes"), kind: "textarea", maxLength: 5000 },
      ]}
      onSave={async (input) => {
        try {
          if (!isCurrent()) return;
          creationId.current ??= crypto.randomUUID();
          await mutation.mutateAsync({
            id: client?.id,
            input: {
              ...input,
              email: input.email.trim().toLowerCase() || null,
              country: input.country === "none" ? null : input.country,
              ...(client ? { version: version.current } : { id: creationId.current }),
            },
          });
          if (isCurrent()) onClose();
        } catch {
          /* Preserve the draft on failure. */
        }
      }}
    />
  );
}
