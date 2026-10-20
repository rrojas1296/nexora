import type { ModuleKey } from "@/components/layout/navigation";
import { ProductsScreen } from "@/features/products/components/products-screen";
import { OrdersScreen } from "@/features/orders/components/orders-screen";
import { ClientsScreen } from "@/features/clients/components/clients-screen";
import { ConversationsScreen } from "@/features/conversations/components/conversations-screen";
import { AgentScreen } from "@/features/agent/components/agent-screen";
import { SettingsScreen } from "@/features/settings/components/settings-screen";
import { StoresScreen } from "@/features/stores/components/stores-screen";
import { HelpScreen } from "@/features/help/components/help-screen";
import { AnalyticsScreen } from "@/features/analytics/components/analytics-screen";
import { ReportsScreen } from "@/features/analytics/components/reports-screen";

export function ModuleContent({ module }: { module: ModuleKey }) {
  switch (module) {
    case "dashboard":
      return <AnalyticsScreen />;
    case "reports":
      return <ReportsScreen />;
    case "products":
      return <ProductsScreen />;
    case "orders":
      return <OrdersScreen />;
    case "clients":
      return <ClientsScreen />;
    case "conversations":
      return <ConversationsScreen />;
    case "agent":
      return <AgentScreen />;
    case "stores":
      return <StoresScreen />;
    case "settings":
      return <SettingsScreen />;
    case "help":
      return <HelpScreen />;
  }
}
