"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ConversationOrder as Order } from "../schemas/commerce-schema";
import type { InboxScope } from "../schemas/inbox-schema";
import { useProofReview } from "../hooks/use-conversation-orders";
import { PrivateAttachment } from "./private-attachment";

export function ConversationOrder({
  scope,
  threadId,
  order,
  canManage,
  refreshing,
}: {
  scope: InboxScope;
  threadId: string;
  order: Order;
  canManage: boolean;
  refreshing: boolean;
}) {
  const t = useTranslations("ConversationCommerce");
  const mutation = useProofReview(scope, threadId);
  return (
    <article className="space-y-4 border-t py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="break-all text-xs font-medium">{order.reference}</h4>
        <span className="rounded-full border px-2 py-1 text-xs">{t(`orders.${order.status}`)}</span>
      </div>
      <ul className="space-y-2 text-xs">
        {order.items.map((item) => (
          <li key={item.productId} className="flex flex-wrap justify-between gap-2">
            <span className="min-w-0 break-words">
              {item.quantity} × {item.name}
            </span>
            <span>
              {item.unitPrice} {order.currency} {t("perUnit")}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium">
        {t("subtotal")}: {order.subtotal} {order.currency}
      </p>
      <p className="text-xs leading-6 text-muted-foreground">{t("noStockReservation")}</p>
      <dl className="space-y-3 text-xs leading-6">
        <div>
          <dt className="font-medium">{t("payment")}</dt>
          <dd>{t(`payments.${order.paymentStatus}`)}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("delivery")}</dt>
          <dd>{t(order.deliveryMode === "DELIVERY" ? "deliveryMode" : "pickup")}</dd>
          {order.deliveryMode === "DELIVERY" ? (
            <dd className="space-y-1">
              <p className="whitespace-pre-wrap break-words">{order.deliveryAddress}</p>
              <p className="whitespace-pre-wrap break-words">{order.deliveryReference}</p>
              {order.latitude !== null && order.longitude !== null ? (
                <p dir="ltr">
                  {order.latitude}, {order.longitude}
                </p>
              ) : null}
              <p className="text-muted-foreground">{t("quotePending")}</p>
            </dd>
          ) : null}
        </div>
      </dl>
      {order.proofs.length ? (
        <div className="space-y-4">
          <h5 className="text-xs font-medium">{t("proofs")}</h5>
          <p className="text-xs leading-6 text-muted-foreground">{t("proofHint")}</p>
          {order.proofs.map((proof, index) => (
            <div key={proof.id} className="space-y-3 rounded-xl border p-3">
              <p className="text-xs">
                {t("proofNumber", { number: index + 1 })}: {t(`proofStatuses.${proof.status}`)}
              </p>
              <PrivateAttachment scope={scope} threadId={threadId} messageId={proof.messageId} />
              {canManage && ["DRAFT", "PENDING"].includes(order.status) ? (
                <div className="flex flex-wrap gap-2">
                  {(["VALIDATED", "REJECTED"] as const).map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending || refreshing || proof.status === status}
                      onClick={() => {
                        if (
                          !window.confirm(
                            t(status === "VALIDATED" ? "validateConfirm" : "rejectConfirm"),
                          )
                        )
                          return;
                        mutation.mutate({
                          orderId: order.id,
                          proofId: proof.id,
                          input: { status, revision: proof.revision, orderVersion: order.version },
                        });
                      }}
                    >
                      {t(status === "VALIDATED" ? "validate" : "reject")}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {mutation.isPending ? (
            <output className="block text-xs text-muted-foreground">{t("saving")}</output>
          ) : null}
          {mutation.isError ? (
            <p role="alert" className="text-xs text-destructive">
              {t("reviewError")}
            </p>
          ) : null}
          {mutation.isSuccess ? (
            <output className="block text-xs text-muted-foreground">{t("reviewSaved")}</output>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
