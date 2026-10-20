"use client";

import { useTranslations } from "next-intl";
import { isThemePreference, themePreferences } from "@/lib/theme/theme-config";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeSelect() {
  const t = useTranslations("Theme");
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">{t("label")}</span>
      <select
        value={preference}
        onChange={(event) => {
          if (isThemePreference(event.target.value)) setPreference(event.target.value);
        }}
        className="h-8 max-w-28 rounded-full border border-border bg-card/60 px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {themePreferences.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
