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
        <div className="space-y-4">
          <MetricCards comparison={comparison} conversations={query.data.conversations.length} />
          <div className="grid items-start gap-4 xl:grid-cols-4">
            <div className="min-w-0 space-y-4 xl:col-span-3">
              <SalesSummary
                comparison={comparison}
                year={year}
                years={years}
                onYearChange={setYear}
              />
              <DashboardOrders workspace={query.data} orders={comparison.current.orders} />
            </div>
            <aside className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-1">
              <DashboardAgent workspace={query.data} />
              <DashboardProducts workspace={query.data} sales={comparison.current.sales} />
              <DashboardInbox workspace={query.data} />
            </aside>
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}
