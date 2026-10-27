"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { productInputSchema, type Product, type ProductInput } from "../schemas/product-schema";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  useCategories,
  useProductAccess,
  useProductMutation,
  useProductImageUpload,
} from "../hooks/use-products";
import { ProductImageInput } from "./product-image-input";
import { productErrorKey } from "../services/product-error";
import { RecordForm } from "@/features/demo/components/record-form";

export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const t = useTranslations("Products");
  const mutation = useProductMutation();
  const imageUpload = useProductImageUpload();
  const access = useProductAccess();
  const categories = useCategories();
  const form = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product
      ? { ...product, sku: product.sku ?? "" }
      : {
          name: "",
          sku: "",
          description: "",
          category: "",
          imageUrl: "",
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <p role={categories.isError ? "alert" : "status"} className="text-xs text-muted-foreground">
          {t(
            categories.isPending
              ? "categoriesLoading"
              : categories.isError
                ? "categoriesError"
                : !categories.data?.length
                  ? "categoriesEmpty"
                  : "categoriesHint",
          )}
        </p>
        {categories.isError ? (
          <Button
            variant="outline"
            disabled={categories.isFetching}
            onClick={() => {
              void categories.refetch();
            }}
          >
            {t("retryCategories")}
          </Button>
        ) : null}
        <Button asChild variant="outline" disabled={mutation.isPending}>
          <Link href="/products/categories">{t("manageCategories")}</Link>
        </Button>
      </div>
      <RecordForm
        readOnly={!categories.isSuccess || !categories.data.length || !access.canWrite}
        form={form}
        columns
        pending={mutation.isPending || imageUpload.isPending}
        error={mutation.error}
        errorMessage={
          mutation.error ? t(`errors.${productErrorKey(mutation.error, true)}`) : undefined
        }
        onCancel={onClose}
        fields={[
          { name: "name", label: t("name"), section: t("identity") },
          { name: "sku", label: t("sku"), hint: t("optional"), maxLength: 30 },
          {
            name: "category",
            label: t("category"),
            kind: "select",
            placeholder: t("selectCategory"),
            options:
              categories.data?.map((category) => ({
                value: category.name,
                label: category.name,
              })) ?? [],
          },
          { name: "brand", label: t("brand"), hint: t("optional"), maxLength: 100 },
          { name: "barcode", label: t("barcode"), hint: t("optional"), maxLength: 50 },
          { name: "supplier", label: t("supplier"), hint: t("optional"), maxLength: 100 },
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
          if (imageUpload.isPending || !access.isCurrent()) return;
          try {
            await mutation.mutateAsync({ type: "save", id: product?.id, input });
            if (access.isCurrent()) onClose();
          } catch {
            /* Preserve the draft on failure; the form renders the error. */
          }
        }}
      >
        <ProductImageInput
          control={form.control}
          disabled={
            mutation.isPending ||
            !access.canWrite ||
            !categories.isSuccess ||
            !categories.data.length
          }
          uploading={imageUpload.isPending}
          upload={imageUpload.mutateAsync}
          isCurrent={access.isCurrent}
        />
      </RecordForm>
    </div>
  );
}
