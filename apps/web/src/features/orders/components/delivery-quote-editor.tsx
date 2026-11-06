"use client";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCommerceAccess, useCommerceMutation } from "@/features/commerce/hooks/use-commerce";
import { commerceErrorKey } from "@/features/commerce/services/commerce-error";
import { RecordForm } from "@/features/demo/components/record-form";
import { deliveryQuoteSchema, type DeliveryQuoteInput } from "../schemas/delivery-quote-schema";
import type { Order } from "../schemas/order-schema";
export function DeliveryQuoteEditor({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations("Delivery");
  const c = useTranslations("Commerce");
  const { canWrite, isCurrent } = useCommerceAccess();
  const mutation = useCommerceMutation("orders");
  const version = useRef(order.version);
  const form = useForm<DeliveryQuoteInput>({
    resolver: zodResolver(deliveryQuoteSchema),
    defaultValues: {
      status: order.deliveryQuoteStatus === "REJECTED" ? "REJECTED" : "QUOTED",
      fee: order.deliveryFee ?? "",
      note: order.deliveryQuoteNote,
    },
  });
  if (!canWrite || order.status !== "DRAFT" || order.deliveryMode !== "DELIVERY") return null;
  return (
    <section className="space-y-4 border-t pt-6">
      <h2 className="text-base font-medium">{t("quoteTitle")}</h2>
      <p className="max-w-3xl text-xs leading-6 text-muted-foreground">{t("quoteHint")}</p>
      <RecordForm
        form={form}
        pending={mutation.isPending}
        error={mutation.error}
        errorMessage={c(commerceErrorKey(mutation.error))}
        validationMessage={c("validation")}
        onCancel={onClose}
        fields={[
          {
            name: "status",
            label: t("coverage"),
            kind: "select",
            options: [
              { value: "QUOTED", label: t("quoted") },
              { value: "REJECTED", label: t("rejected") },
            ],
          },
          {
            name: "fee",
            label: t("feeCurrency", { currency: order.currency }),
            hint: t("feeHint"),
            maxLength: 15,
          },
          { name: "note", label: t("quoteNote"), kind: "textarea", maxLength: 1024 },
        ]}
        onSave={async (input) => {
          if (!isCurrent()) return;
          try {
            await mutation.mutateAsync({
              id: order.id,
              input: {
                version: version.current,
                deliveryQuote: { ...input, fee: input.status === "REJECTED" ? null : input.fee },
              },
            });
            if (isCurrent()) onClose();
          } catch {
            /* Keep the draft and original version; never replay automatically. */
          }
        }}
      />
    </section>
  );
}
