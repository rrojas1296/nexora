import type { Order, Workspace } from "../types/workspace";

export function orderTotal(order: Order): number {
  return (
    Math.round(
      order.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0) * 100,
    ) / 100
  );
}
export function isSale(order: Order): boolean {
  return order.status === "paid" || order.status === "shipped";
}
export const demoPeriodEnd = "2026-06-14T23:59:59.999Z";
export function getMetrics(workspace: Workspace, days: number, periodEnd = demoPeriodEnd) {
  const end = new Date(periodEnd);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - days + 1);
  start.setUTCHours(0, 0, 0, 0);
  const orders = workspace.orders.filter(
    (order) => new Date(order.createdAt) >= start && new Date(order.createdAt) <= end,
  );
  const sales = orders.filter(isSale);
  const revenue = sales.reduce((sum, order) => sum + orderTotal(order), 0);
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const day = date.toISOString().slice(0, 10);
    return {
      date: day,
      revenue: sales
        .filter((order) => order.createdAt.startsWith(day))
        .reduce((sum, order) => sum + orderTotal(order), 0),
    };
  });
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    orders,
    sales,
    revenue,
    average: sales.length ? revenue / sales.length : 0,
    buyers: new Set(sales.map((order) => order.clientId)).size,
    series,
  };
}
