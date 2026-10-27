"use client";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useProduct } from "@/features/products/hooks/use-products";
import type { OrderInput } from "../schemas/order-schema";
export function OrderLineField({
  form,
  index,
  options,
  onRemove,
}: {
  form: UseFormReturn<OrderInput>;
  index: number;
  options: { value: string; label: string }[];
  onRemove: () => void;
}) {
  const t = useTranslations("Orders");
  const c = useTranslations("Commerce");
  const productId = useWatch({ control: form.control, name: `items.${index}.productId` });
  const product = useProduct(productId);
  const choices =
    productId && !options.some((option) => option.value === productId)
      ? [{ value: productId, label: product.data?.name ?? productId }, ...options]
      : options;
  const error = form.formState.errors.items?.[index];
  return (
    <div className="grid items-end gap-3 rounded-2xl border p-4 sm:grid-cols-5">
      <div className="space-y-2 sm:col-span-3">
        <label htmlFor={`product-${index}`} className="block text-xs font-medium">
          {t("product")}
        </label>
        <FormSelectField
          control={form.control}
          name={`items.${index}.productId`}
          id={`product-${index}`}
          options={choices}
          placeholder={c("selectProduct")}
          aria-invalid={!!error?.productId}
        />
        {error?.productId ? (
          <p role="alert" className="text-xs text-destructive">
            {c("validation")}
          </p>
        ) : null}
      </div>
      <InputField
        id={`quantity-${index}`}
        label={t("quantity")}
        type="number"
        min={1}
        max={10000}
        step={1}
        {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
        error={error?.quantity ? c("validation") : undefined}
      />
      <Button
        type="button"
        variant="outline"
        onClick={onRemove}
        aria-label={`${c("removeLine")} ${index + 1}`}
      >
        {c("removeLine")}
      </Button>
    </div>
  );
}
