"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  clientCountries,
  clientInputSchema,
  clientSegments,
} from "@/features/demo/schemas/workspace-schema";
import type { Client, ClientInput } from "@/features/demo/types/workspace";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { RecordForm } from "@/features/demo/components/record-form";

export function ClientEditor({ client, onClose }: { client?: Client; onClose: () => void }) {
  const t = useTranslations("Clients");
  const mutation = useWorkspaceMutation();
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientInputSchema),
    defaultValues: client ?? {
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
      country: "US",
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
      onCancel={onClose}
      fields={[
        { name: "name", label: t("name"), section: t("contact") },
        { name: "email", label: t("email"), kind: "email", maxLength: 254 },
        { name: "phone", label: t("phone"), kind: "tel", maxLength: 16, hint: t("phoneHint") },
        { name: "company", label: t("company") },
        { name: "taxId", label: t("taxId"), maxLength: 50 },
        {
          name: "segment",
          label: t("segment"),
          kind: "select",
          options: clientSegments.map((value) => ({ value, label: t(`segments.${value}`) })),
        },
        { name: "address", label: t("address"), maxLength: 200, section: t("shipping") },
        { name: "city", label: t("city") },
        { name: "region", label: t("region") },
        { name: "postalCode", label: t("postalCode"), maxLength: 20 },
        {
          name: "country",
          label: t("country"),
          kind: "select",
          options: clientCountries.map((value) => ({ value, label: t(`countries.${value}`) })),
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
        { name: "notes", label: t("notes"), kind: "textarea" },
      ]}
      onSave={async (input) => {
        try {
          await mutation.mutateAsync({ type: "client.save", id: client?.id, input });
          onClose();
        } catch {
          /* Preserve the draft on failure. */
        }
      }}
    />
  );
}
