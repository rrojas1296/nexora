"use client";
import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useCommerceAccess, useCommerceMutation } from "@/features/commerce/hooks/use-commerce";
import { commerceErrorKey } from "@/features/commerce/services/commerce-error";
import { RecordForm } from "@/features/demo/components/record-form";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { orderInputSchema, type Order, type OrderInput } from "../schemas/order-schema";
import { OrderCatalogFields } from "./order-catalog-fields";
import { OrderSummary } from "./order-summary";
import { OrderActions } from "./order-actions";
export function OrderEditor({ order, onClose }: { order?: Order; onClose: () => void }) {
  const c = useTranslations("Commerce");
  const { canWrite, isCurrent } = useCommerceAccess();
  const mutation = useCommerceMutation("orders");
  const creationId = useRef<string | null>(null);
  const version = useRef(order?.version);
  const form = useForm<OrderInput>({
    resolver: zodResolver(orderInputSchema),
    defaultValues: {
      clientId: order?.clientId ?? "",
      items: order?.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })) ?? [{ productId: "", quantity: 1 }],
    },
  });
  const editable = canWrite && (!order || (order.status === "DRAFT" && !order.threadId));
  return (
    <div className="space-y-7">
      {order ? <OrderSummary order={order} /> : null}
      {editable ? (
        <RecordForm
          form={form}
          fields={[]}
          pending={mutation.isPending}
          error={mutation.error}
          errorMessage={c(commerceErrorKey(mutation.error))}
          validationMessage={c("validation")}
          onCancel={onClose}
          onSave={async (input) => {
            if (!isCurrent()) return;
            creationId.current ??= crypto.randomUUID();
            try {
              await mutation.mutateAsync({
                id: order?.id,
                input: order
                  ? { ...input, version: version.current }
                  : { ...input, id: creationId.current },
              });
              if (isCurrent()) onClose();
            } catch {
              /* Keep UUID/version/draft; never automatically replay an uncertain write. */
            }
          }}
        >
          <p className="text-xs leading-6 text-muted-foreground">{c("draftHint")}</p>
          <OrderCatalogFields form={form} />
        </RecordForm>
      ) : !order ? (
        <p role="alert" className="text-sm text-destructive">
          {c("forbidden")}
        </p>
      ) : null}
      {order ? (
        <>
          <OrderActions order={order} />
          {order.threadId ? (
            <Button asChild variant="outline">
              <Link href="/conversations">{c("openInbox")}</Link>
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
