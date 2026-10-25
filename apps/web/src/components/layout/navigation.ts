import {
  Bot,
  ChartNoAxesCombined,
  CircleHelp,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings2,
  ShoppingBag,
  Building2,
  Users,
} from "lucide-react";

export const navigationGroups = [
  {
    label: "workspace",
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "conversations", href: "/conversations", icon: MessageSquare },
      { key: "agent", href: "/agent", icon: Bot },
      { key: "products", href: "/products", icon: Package },
      { key: "orders", href: "/orders", icon: ShoppingBag },
      { key: "clients", href: "/clients", icon: Users },
    ],
  },
  {
    label: "administration",
    items: [
      { key: "reports", href: "/reports", icon: ChartNoAxesCombined },
      { key: "settings", href: "/settings", icon: Settings2 },
      { key: "businesses", href: "/businesses", icon: Building2 },
      { key: "help", href: "/help", icon: CircleHelp },
    ],
  },
] as const;

export type NavigationItem = (typeof navigationGroups)[number]["items"][number];
export type ModuleKey = NavigationItem["key"];

export function getActiveModule(pathname: string): ModuleKey {
  return (
    navigationGroups
      .flatMap((group) => [...group.items])
      .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.key ??
    "dashboard"
  );
}
