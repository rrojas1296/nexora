import { useTranslations } from "next-intl";
export function CommerceKpis({
  metrics,
}: {
  metrics: {
    label:
      | "totalClients"
      | "activeClients"
      | "vipClients"
      | "totalOrders"
      | "draftOrders"
      | "pendingOrders";
    value: number | undefined;
  }[];
}) {
  const t = useTranslations("Commerce");
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-2xl border bg-card p-5">
          <dt className="text-xs text-muted-foreground">{t(metric.label)}</dt>
          <dd className="mt-3 text-2xl tabular-nums">{metric.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
