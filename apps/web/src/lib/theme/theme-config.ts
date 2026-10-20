export const themePreferences = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof themePreferences)[number];
export type EffectiveTheme = Exclude<ThemePreference, "system">;
export const THEME_STORAGE_KEY = "conversa-theme-v1";
export const THEME_STORAGE_VERSION = 1;
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.some((preference) => preference === value);
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): EffectiveTheme {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}
