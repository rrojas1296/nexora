"use client";

import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import type { Product } from "@/features/demo/types/workspace";
import { useValidationMessage } from "@/features/demo/hooks/use-validation-message";
import type { OrderDraft } from "../schemas/order-draft-schema";

export function OrderLineField({
  form,
  products,
  index,
  onRemove,
  canRemove,
  disabled,
}: {
  form: UseFormReturn<OrderDraft>;
  products: Product[];
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("Orders");
  const common = useTranslations("Demo");
  const validation = useValidationMessage();
  const errors = form.formState.errors.items?.[index];
  const id = `order-line-${index}`;
  return (
    <fieldset className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
      <legend className="px-2 text-xs text-muted-foreground">
        {t("line", { number: index + 1 })}
      </legend>
      <div className="space-y-2 lg:col-span-2">
        <label htmlFor={`${id}-product`} className="block text-xs font-medium">
          {t("product")}
        </label>
        <FormSelectField
          control={form.control}
          name={`items.${index}.productId`}
          id={`${id}-product`}
          disabled={disabled}
          options={products.map((row) => ({ value: row.id, label: `${row.name} · ${row.sku}` }))}
          onValueChange={(value) => {
            const product = products.find((row) => row.id === value);
            if (product)
              form.setValue(`items.${index}.unitPrice`, product.price, {
                shouldDirty: true,
                shouldValidate: true,
              });
          }}
        />
      </div>
      <InputField
        id={`${id}-quantity`}
        label={t("quantity")}
        type="number"
        min={1}
        max={1000000}
        step={1}
        {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
        error={validation(errors?.quantity)}
      />
      <InputField
        id={`${id}-price`}
        label={t("unitPrice")}
        type="number"
        min={0}
        max={999999}
        step={0.01}
        {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
        error={validation(errors?.unitPrice)}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRemove}
        onClick={onRemove}
        className="justify-self-start"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {common("delete")}
      </Button>
    </fieldset>
  );
}
