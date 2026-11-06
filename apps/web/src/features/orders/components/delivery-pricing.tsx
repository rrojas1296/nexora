"use client";
import { useFormatter, useTranslations } from "next-intl";
import type { Order } from "../schemas/order-schema";
export function DeliveryPricing({
  order,
}: {
  order: Pick<
    Order,
    | "currency"
    | "deliveryMode"
    | "deliveryQuoteStatus"
    | "deliveryFee"
    | "total"
    | "deliveryQuoteNote"
  >;
}) {
  const t = useTranslations("Delivery");
  const format = useFormatter();
  const money = (value: string) =>
    format.number(Number(value), { style: "currency", currency: order.currency });
  return (
    <div className="space-y-2 text-xs leading-6">
      {order.deliveryMode === "DELIVERY" ? (
        <>
          <p>
            {t(
              order.deliveryQuoteStatus === "QUOTED"
                ? "quoted"
                : order.deliveryQuoteStatus === "REJECTED"
                  ? "rejected"
                  : "pending",
            )}
          </p>
          <p>
            {t("fee")}: {order.deliveryFee !== null ? money(order.deliveryFee) : t("notQuoted")}
          </p>
          {order.deliveryQuoteNote ? (
            <p className="whitespace-pre-wrap break-words text-muted-foreground">
              {order.deliveryQuoteNote}
            </p>
          ) : null}
        </>
      ) : null}
      <p className="font-medium">
        {t("total")}: {order.total !== null ? money(order.total) : t("notQuoted")}
      </p>
    </div>
  );
}
