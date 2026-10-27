"use client";
import { useFormatter, useTranslations } from "next-intl";
import type { Order } from "../schemas/order-schema";
export function OrderSummary({ order }: { order: Order }) {
  const t = useTranslations("Orders");
  const c = useTranslations("Commerce");
  const format = useFormatter();
  const money = (value: string) =>
    format.number(Number(value), { style: "currency", currency: order.currency });
  return (
    <div className="space-y-5">
      <p className="break-all text-sm font-medium">{order.reference}</p>
      <dl className="grid gap-4 text-xs sm:grid-cols-2">
        {[
          { label: t("client"), value: order.clientName ?? "—" },
          {
            label: t("date"),
            value: format.dateTime(new Date(order.placedAt), {
              dateStyle: "medium",
              timeZone: "UTC",
            }),
          },
          { label: c("orderStatus"), value: c(`statuses.${order.status}`) },
          {
            label: c("payment"),
            value:
              order.paymentStatus === "PENDING" ||
              order.paymentStatus === "IN_REVIEW" ||
              order.paymentStatus === "VALIDATED" ||
              order.paymentStatus === "REJECTED"
                ? c(`payments.${order.paymentStatus}`)
                : c("unknown"),
          },
        ].map((field) => (
          <div key={field.label}>
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="mt-2 break-words">{field.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="divide-y rounded-2xl border px-4">
        {order.items.map((item) => (
          <li key={item.productId} className="flex flex-wrap justify-between gap-4 py-4 text-xs">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>
              {money(item.unitPrice)} {c("perUnit")}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium">
        {c("subtotal")}: {money(order.subtotal)}
      </p>
      <section className="space-y-2 text-xs leading-6">
        <h3 className="font-medium">{c("delivery")}</h3>
        <p>{c(order.deliveryMode === "DELIVERY" ? "deliveryRequested" : "pickup")}</p>
        {order.deliveryAddress ? (
          <p className="whitespace-pre-wrap break-words">{order.deliveryAddress}</p>
        ) : null}
        {order.deliveryReference ? (
          <p className="whitespace-pre-wrap break-words">{order.deliveryReference}</p>
        ) : null}
        {order.latitude !== null && order.longitude !== null ? (
          <p>
            {c("coordinates")}: {order.latitude}, {order.longitude}
          </p>
        ) : null}
      </section>
      <p className="text-xs leading-6 text-muted-foreground">{c("limits")}</p>
    </div>
  );
}
