import { orderTotal } from "@/features/demo/lib/metrics";
import type { Order, Workspace } from "@/features/demo/types/workspace";

export type ReportView = "products" | "clients";
export type ReportRow = {
  id: string;
  name: string;
  reference: string;
  quantity: number;
  orders: number;
  revenue: number;
};
export function getReportRows(
  workspace: Workspace,
  sales: readonly Order[],
  view: ReportView,
): ReportRow[] {
  const rows = new Map<string, ReportRow>();
  for (const order of sales) {
    if (view === "clients") {
      const client = workspace.clients.find((row) => row.id === order.clientId);
      const row = rows.get(order.clientId) ?? {
        id: order.clientId,
        name: client?.name ?? order.clientId,
        reference: client?.company ?? "",
        quantity: 0,
        orders: 0,
        revenue: 0,
      };
      row.quantity += order.items.reduce((sum, item) => sum + item.quantity, 0);
      row.orders += 1;
      row.revenue += orderTotal(order);
      rows.set(row.id, row);
    } else {
      const seen = new Set<string>();
      for (const item of order.items) {
        const product = workspace.products.find((row) => row.id === item.productId);
        const row = rows.get(item.productId) ?? {
          id: item.productId,
          name: item.name,
          reference: product?.sku ?? "",
          quantity: 0,
          orders: 0,
          revenue: 0,
        };
        row.quantity += item.quantity;
        row.revenue += item.quantity * item.unitPrice;
        if (!seen.has(item.productId)) row.orders += 1;
        seen.add(item.productId);
        rows.set(row.id, row);
      }
    }
  }
  return [...rows.values()].toSorted(
    (a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name),
  );
}
