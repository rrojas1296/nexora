import { getMetrics, orderTotal } from "@/features/demo/lib/metrics";
import type { Workspace } from "@/features/demo/types/workspace";

const millisecondsPerDay = 24 * 60 * 60 * 1000;
export type SalesMetric = "revenue" | "orders";

export function getMonthlySalesComparison(workspace: Workspace, year: number) {
  const yearMetrics = (value: number) => {
    const days = (Date.UTC(value + 1, 0, 1) - Date.UTC(value, 0, 1)) / millisecondsPerDay;
    return getMetrics(workspace, days, `${value}-12-31T23:59:59.999Z`);
  };
  const current = yearMetrics(year);
  const previous = yearMetrics(year - 1);
  const monthlyTotals = (metrics: typeof current) => {
    const totals = Array.from({ length: 12 }, () => ({ revenue: 0, orders: 0 }));
    for (const order of metrics.sales) {
      const month = new Date(order.createdAt).getUTCMonth();
      const total = totals[month];
      if (total) {
        total.revenue += orderTotal(order);
        total.orders += 1;
      }
    }
    return totals;
  };
  const currentTotals = monthlyTotals(current);
  const previousTotals = monthlyTotals(previous);
  return {
    current,
    previous,
    change: previous.revenue > 0 ? (current.revenue - previous.revenue) / previous.revenue : null,
    series: Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      return {
        date: `${year}-${month}-01`,
        previousDate: `${year - 1}-${month}-01`,
        current: currentTotals[index]?.revenue ?? 0,
        previous: previousTotals[index]?.revenue ?? 0,
        currentOrders: currentTotals[index]?.orders ?? 0,
        previousOrders: previousTotals[index]?.orders ?? 0,
      };
    }),
  };
}
export type MonthlySalesComparison = ReturnType<typeof getMonthlySalesComparison>;

export function getMonthlyMetricSeries(comparison: MonthlySalesComparison, metric: SalesMetric) {
  return comparison.series.map((row) => ({
    ...row,
    current: metric === "orders" ? row.currentOrders : row.current,
    previous: metric === "orders" ? row.previousOrders : row.previous,
  }));
}
