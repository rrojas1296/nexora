import { SYSTEM_THEME_QUERY, THEME_STORAGE_KEY, THEME_STORAGE_VERSION } from "./theme-config";

// Serialized into the document head: keep this function independent of module scope.
function bootstrapTheme(storageKey: string, version: number, mediaQuery: string) {
  let preference = "system";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    const storedPreference = saved?.state?.preference;
    if (
      saved?.version === version &&
      (storedPreference === "light" || storedPreference === "dark" || storedPreference === "system")
    ) {
      preference = storedPreference;
    }
  } catch {
    // A blocked or corrupted storage must not prevent rendering.
  }
  const effectiveTheme =
    preference === "system"
      ? window.matchMedia(mediaQuery).matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.dataset.theme = effectiveTheme;
}

export const themeBootstrapScript = `(${bootstrapTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)},${THEME_STORAGE_VERSION},${JSON.stringify(SYSTEM_THEME_QUERY)});`;
