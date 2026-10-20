"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { productInputSchema } from "@/features/demo/schemas/workspace-schema";
import type { Product, ProductInput } from "@/features/demo/types/workspace";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { RecordForm } from "@/features/demo/components/record-form";

export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const t = useTranslations("Products");
  const mutation = useWorkspaceMutation();
  const form = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product ?? {
      name: "",
      sku: "",
      description: "",
      category: "",
      brand: "",
      supplier: "",
      barcode: "",
      price: 0,
      cost: 0,
      compareAtPrice: 0,
      stock: 0,
      weight: 0,
      lowStockThreshold: 5,
      active: true,
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
        { name: "name", label: t("name"), section: t("identity") },
        { name: "sku", label: t("sku"), maxLength: 30 },
        { name: "category", label: t("category") },
        { name: "brand", label: t("brand") },
        { name: "barcode", label: t("barcode"), maxLength: 50 },
        { name: "supplier", label: t("supplier") },
        { name: "description", label: t("description"), kind: "textarea" },
        {
          name: "price",
          label: t("price"),
          section: t("pricing"),
          kind: "number",
          min: 0,
          max: 999999,
          step: 0.01,
        },
        { name: "cost", label: t("cost"), kind: "number", min: 0, max: 999999, step: 0.01 },
        {
          name: "compareAtPrice",
          label: t("compareAtPrice"),
          hint: t("compareHint"),
          kind: "number",
          min: 0,
          max: 999999,
          step: 0.01,
        },
        {
          name: "stock",
          label: t("stock"),
          section: t("inventory"),
          kind: "number",
          min: 0,
          max: 1000000,
          step: 1,
        },
        {
          name: "lowStockThreshold",
          label: t("lowStockThreshold"),
          kind: "number",
          min: 0,
          max: 1000000,
          step: 1,
        },
        { name: "weight", label: t("weight"), kind: "number", min: 0, max: 1000000, step: 1 },
        { name: "active", label: t("active"), kind: "checkbox" },
      ]}
      onSave={async (input) => {
        try {
          await mutation.mutateAsync({ type: "product.save", id: product?.id, input });
          onClose();
        } catch {
          /* Preserve the draft on failure; the form renders the error. */
        }
      }}
    />
  );
}
