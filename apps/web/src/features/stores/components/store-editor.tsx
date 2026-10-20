"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { currencies, storeInputSchema } from "@/features/demo/schemas/workspace-schema";
import type { Store, StoreInput } from "@/features/demo/types/workspace";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { RecordForm } from "@/features/demo/components/record-form";

export function StoreEditor({ store, onClose }: { store?: Store; onClose: () => void }) {
  const t = useTranslations("Stores");
  const mutation = useWorkspaceMutation();
  const form = useForm<StoreInput>({
    resolver: zodResolver(storeInputSchema),
    defaultValues: store ?? {
      name: "",
      address: "",
      currency: "USD",
      timezone: "America/Mexico_City",
      active: true,
    },
  });
  return (
    <RecordForm
      columns
      form={form}
      pending={mutation.isPending}
      error={mutation.error}
      onCancel={onClose}
      fields={[
        { name: "name", label: t("name") },
        { name: "address", label: t("address"), maxLength: 200 },
        {
          name: "currency",
          label: t("currency"),
          kind: "select",
          options: currencies.map((value) => ({ value, label: value })),
        },
        {
          name: "timezone",
          label: t("timezone"),
          kind: "select",
          options: [
            "America/Mexico_City",
            "America/Bogota",
            "America/New_York",
            "Europe/Madrid",
          ].map((value) => ({ value, label: value })),
        },
        { name: "active", label: t("active"), kind: "checkbox" },
      ]}
      onSave={async (input) => {
        try {
          await mutation.mutateAsync({ type: "store.save", id: store?.id, input });
          onClose();
        } catch {
          /* Preserve the draft on failure. */
        }
      }}
    />
  );
}
