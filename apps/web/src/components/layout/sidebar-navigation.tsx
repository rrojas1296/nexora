"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navigationGroups } from "./navigation";
import { cn } from "@/lib/utils/cn";

export function SidebarNavigation({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Nav");
  const shell = useTranslations("Shell");
  const pathname = usePathname();
  return (
    <nav aria-label={shell("navigation")} className="space-y-6 px-3">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className={cn("mb-2 px-3 text-xs text-sidebar-muted", compact && "sr-only")}>
            {t(group.label)}
          </p>
          <ul className="space-y-1">
            {group.items.map(({ key, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    title={compact ? t(key) : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
                      compact && "justify-center px-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-ring"
                        : "text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                    <span className={cn(compact && "sr-only")}>{t(key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
