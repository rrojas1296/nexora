"use client";

import { useState } from "react";
import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { QueryState } from "@/features/demo/components/query-state";
import { getMonthlySalesComparison } from "../lib/sales-comparison";
import { demoPeriodEnd } from "@/features/demo/lib/metrics";
import { MetricCards } from "./metric-cards";
import { SalesSummary } from "./sales-summary";
import { DashboardOrders } from "./dashboard-orders";
import { DashboardAgent } from "./dashboard-agent";
import { DashboardProducts } from "./dashboard-products";
import { DashboardInbox } from "./dashboard-inbox";
import { DashboardToolbar } from "./dashboard-toolbar";
import { DashboardAttention } from "./dashboard-attention";

export function AnalyticsScreen() {
  const query = useWorkspace();
  const demoYear = new Date(demoPeriodEnd).getUTCFullYear();
  const [year, setYear] = useState(demoYear);
  const years = [
    ...new Set([
      demoYear,
      demoYear - 1,
      year,
      ...(query.data?.orders.map((order) => new Date(order.createdAt).getUTCFullYear()) ?? []),
    ]),
  ].toSorted((a, b) => b - a);
  const comparison = query.data ? getMonthlySalesComparison(query.data, year) : null;
  return (
    <QueryState
      pending={query.isPending}
      error={query.isError}
      retry={() => {
        void query.refetch();
      }}
    >
      {query.data && comparison ? (
        <div className="space-y-5">
          <DashboardToolbar year={year} years={years} onYearChange={setYear} />
          <MetricCards comparison={comparison} conversations={query.data.conversations.length} />
          <div className="grid items-start gap-5 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <SalesSummary comparison={comparison} year={year} />
            </div>
            <aside className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-1">
              <DashboardAttention workspace={query.data} />
              <DashboardAgent workspace={query.data} />
            </aside>
          </div>
          <DashboardOrders workspace={query.data} orders={comparison.current.orders} />
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <DashboardProducts workspace={query.data} sales={comparison.current.sales} />
            <DashboardInbox workspace={query.data} />
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}
