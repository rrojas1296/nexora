"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getActiveModule } from "./navigation";
import { LocaleSelect } from "./locale-select";
import { ThemeSelect } from "./theme-select";
import { MobileNavigation } from "./mobile-navigation";
import { SessionControl } from "@/features/auth/components/session-control";

export function Header() {
  const nav = useTranslations("Nav");
  const pathname = usePathname();
  return (
    <header className="flex min-h-22 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-5 sm:px-6 lg:px-7 xl:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNavigation />
        <p className="text-xl font-normal tracking-tight sm:text-2xl">
          {nav(getActiveModule(pathname))}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LocaleSelect />
        <ThemeSelect />
        <SessionControl />
      </div>
    </header>
  );
}
