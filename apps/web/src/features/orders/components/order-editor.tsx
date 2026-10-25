"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useFormatter, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { defaultCurrency } from "@/lib/config/currency";
import { Button } from "@/components/ui/button";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Link } from "@/i18n/navigation";
import { orderStatuses } from "@/features/demo/schemas/workspace-schema";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { MutationNotice } from "@/features/demo/components/mutation-notice";
import type { Order, Workspace } from "@/features/demo/types/workspace";
import { orderDraftSchema, type OrderDraft } from "../schemas/order-draft-schema";
import { OrderLineField } from "./order-line-field";

export function OrderEditor({
  order,
  workspace,
  onClose,
}: {
  order?: Order;
  workspace: Workspace;
  onClose: () => void;
}) {
  const t = useTranslations("Orders");
  const common = useTranslations("Demo");
  const format = useFormatter();
  const mutation = useWorkspaceMutation();
  const product = workspace.products.find((row) => row.active) ?? workspace.products[0];
  const newItem = { productId: product?.id ?? "", quantity: 1, unitPrice: product?.price ?? 0 };
  const form = useForm<OrderDraft>({
    resolver: zodResolver(orderDraftSchema),
    defaultValues: {
      clientId: order?.clientId ?? workspace.clients[0]?.id ?? "",
      status: order?.status ?? "pending",
      items: order?.items ?? [newItem],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });
  const total = items.reduce(
    (sum, row) =>
      sum +
      (Number.isFinite(row.quantity * row.unitPrice)
        ? Math.round(row.quantity * row.unitPrice * 100) / 100
        : 0),
    0,
  );
  if (!workspace.clients.length || !workspace.products.length)
    return (
      <div className="space-y-4">
        <h2 className="text-lg">{t("needsResources")}</h2>
        <p className="text-sm text-muted-foreground">{t("needsResourcesHint")}</p>
        <div className="flex flex-wrap gap-2">
          {(["clients", "products"] as const).map((resource) => (
            <Button asChild key={resource} variant="outline">
              <Link href={`/${resource}/new`}>{t(`add.${resource}`)}</Link>
            </Button>
          ))}
        </div>
      </div>
    );
  return (
    <form
      method="post"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(async (values) => {
          try {
            await mutation.mutateAsync({
              type: "order.save",
              id: order?.id,
              input: {
                ...values,
                currency: defaultCurrency,
                createdAt: order?.createdAt ?? new Date().toISOString(),
                items: values.items.map((item) => ({
                  ...item,
                  name: workspace.products.find((row) => row.id === item.productId)?.name ?? "",
                })),
              },
            });
            onClose();
          } catch {
            /* Keep the entered order so it can be retried. */
          }
        })(event);
      }}
      aria-busy={mutation.isPending}
    >
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <legend className="sr-only">{common("form")}</legend>
        <h2 className="border-b pb-3 text-base font-medium">{t("orderInfo")}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="order-client" className="block text-xs font-medium">
              {t("client")}
            </label>
            <FormSelectField
              control={form.control}
              name="clientId"
              id="order-client"
              disabled={mutation.isPending}
              options={workspace.clients.map((row) => ({ value: row.id, label: row.name }))}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="order-status" className="block text-xs font-medium">
              {common("statusLabel")}
            </label>
            <FormSelectField
              control={form.control}
              name="status"
              id="order-status"
              disabled={mutation.isPending}
              options={orderStatuses.map((status) => ({
                value: status,
                label: common(`status.${status}`),
              }))}
            />
          </div>
        </div>
        <h2 className="border-b pb-3 text-base font-medium">{t("items")}</h2>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <OrderLineField
              key={field.id}
              form={form}
              products={workspace.products}
              index={index}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              disabled={mutation.isPending}
            />
          ))}
        </div>
        <Button variant="outline" onClick={() => append(newItem)} disabled={fields.length >= 100}>
          <Plus className="size-4" aria-hidden="true" />
          {t("addItem")}
        </Button>
        <div className="flex items-center justify-between border-t pt-5">
          <span className="text-sm text-muted-foreground">{t("total")}</span>
          <output className="text-2xl tabular-nums">
            {format.number(total, { style: "currency", currency: defaultCurrency })}
          </output>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">{t("editorHint")}</p>
        <MutationNotice error={mutation.error} />
        <div className="flex justify-end gap-2 border-t pt-5">
          <Button variant="outline" onClick={onClose}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {common(mutation.isPending ? "saving" : "save")}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
