"use client";

import { Suspense } from "react";
import { ArrowUpRight, PanelLeftClose, PanelLeftOpen, Store, Unplug } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils/cn";
import { Brand } from "./brand";
import { SidebarNavigation } from "./sidebar-navigation";

export function Sidebar() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const t = useTranslations("Shell");
  const common = useTranslations("Common");
  const nav = useTranslations("Nav");
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex motion-reduce:transition-none",
        collapsed ? "w-18" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex min-h-22 shrink-0 items-center justify-between gap-2 px-5",
          collapsed && "flex-col justify-center gap-3 px-0 py-5",
        )}
      >
        <Brand compact={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("expand") : t("collapse")}
          aria-expanded={!collapsed}
          title={collapsed ? t("expand") : t("collapse")}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-sidebar-muted outline-none hover:bg-sidebar-accent hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-3.5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
      <div
        className={cn(
          "mx-4 mb-6 flex items-center gap-2.5 border-b border-sidebar-border px-1 pb-5",
          collapsed && "mx-3 justify-center",
        )}
        title={t("workspaceLabel")}
      >
        <Store className="size-4 shrink-0 text-sidebar-muted" aria-hidden="true" />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-xs text-sidebar-foreground">{common("workspace")}</p>
            <p className="mt-1 text-xs text-sidebar-muted">{t("plan")}</p>
          </div>
        ) : (
          <span className="sr-only">{t("workspaceLabel")}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-5">
        <Suspense
          fallback={
            <div
              className="mx-3 h-80 animate-pulse rounded-xl bg-sidebar-accent"
              aria-busy="true"
            />
          }
        >
          <SidebarNavigation compact={collapsed} />
        </Suspense>
      </div>
      <div className="mx-4 mt-auto shrink-0 border-t border-sidebar-border py-5">
        {collapsed ? (
          <div className="flex justify-center" title={t("connection")}>
            <Unplug className="size-4 text-sidebar-muted" aria-hidden="true" />
            <span className="sr-only">{t("connection")}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-sidebar-muted">
              <span className="size-1.5 rounded-full bg-sidebar-ring" aria-hidden="true" />
              {t("connection")}
            </div>
            <Link
              href="/help"
              className="flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-3 text-xs outline-none hover:border-sidebar-muted focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              {nav("help")}
              <ArrowUpRight className="size-3.5 text-sidebar-muted" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
