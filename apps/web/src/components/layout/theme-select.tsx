"use client";

import { useTranslations } from "next-intl";
import { SelectField } from "@/components/ui/select-field";
import { isThemePreference, themePreferences } from "@/lib/theme/theme-config";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeSelect() {
  const t = useTranslations("Theme");
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  return (
    <SelectField
      aria-label={t("label")}
      value={preference}
      onValueChange={(value) => {
        if (isThemePreference(value)) setPreference(value);
      }}
      size="sm"
      className="w-fit max-w-36 rounded-full bg-card/60 text-xs"
      options={themePreferences.map((value) => ({ value, label: t(value) }))}
    />
  );
}
