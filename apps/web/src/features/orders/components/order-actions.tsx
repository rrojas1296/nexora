"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { useCommerceAccess, useCommerceMutation } from "@/features/commerce/hooks/use-commerce";
import { commerceErrorKey } from "@/features/commerce/services/commerce-error";
import type { Order } from "../schemas/order-schema";
export function OrderActions({ order }: { order: Order }) {
  const c = useTranslations("Commerce");
  const { canWrite, isCurrent } = useCommerceAccess();
  const mutation = useCommerceMutation("orders");
  const [status, setStatus] = useState("none");
  const allowed: Order["status"][] = [];
  if (order.status === "DRAFT" && !order.threadId) allowed.push("PENDING");
  if (["DRAFT", "PENDING"].includes(order.status)) allowed.push("CANCELLED");
  if (order.status === "PENDING" && order.paymentStatus === "VALIDATED") allowed.push("PAID");
  if (order.status === "PAID") allowed.push("SHIPPED");
  if (!canWrite) return null;
  return (
    <section className="space-y-4 border-t pt-5">
      <h2 className="text-sm font-medium">{c("changeStatus")}</h2>
      {order.threadId && order.status === "DRAFT" ? (
        <p className="text-xs leading-6 text-muted-foreground">{c("customerConfirmation")}</p>
      ) : null}
      {allowed.length ? (
        <>
          <label className="block space-y-2 text-xs">
            <span>{c("nextStatus")}</span>
            <SelectField
              value={status}
              onValueChange={setStatus}
              disabled={mutation.isPending}
              options={[
                { value: "none", label: c("selectStatus") },
                ...allowed.map((value) => ({ value, label: c(`statuses.${value}`) })),
              ]}
            />
          </label>
          <Button
            disabled={mutation.isPending || !allowed.some((value) => value === status)}
            onClick={async () => {
              const next = allowed.find((value) => value === status);
              if (
                !next ||
                !isCurrent() ||
                !window.confirm(c("statusConfirm", { status: c(`statuses.${next}`) }))
              )
                return;
              try {
                await mutation.mutateAsync({
                  id: order.id,
                  input: { version: order.version, status: next },
                });
                if (isCurrent()) setStatus("none");
              } catch {
                /* Reconcile reads without replaying the transition. */
              }
            }}
          >
            {c(mutation.isPending ? "saving" : "applyStatus")}
          </Button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{c("noTransitions")}</p>
      )}
      {mutation.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {c(commerceErrorKey(mutation.error))}
        </p>
      ) : null}
    </section>
  );
}
