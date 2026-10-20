"use client";

import { useEffect, type ReactNode } from "react";
import { resolveTheme, SYSTEM_THEME_QUERY } from "@/lib/theme/theme-config";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const applyTheme = () => {
      document.documentElement.dataset.theme = resolveTheme(
        useThemeStore.getState().preference,
        media.matches,
      );
    };
    // Rehydrate before subscribing to avoid replacing the pre-paint preference with the default.
    void Promise.resolve(useThemeStore.persist.rehydrate()).then(applyTheme);
    const unsubscribe = useThemeStore.subscribe(applyTheme);
    const onStorage = (event: StorageEvent) => {
      if (event.key === useThemeStore.persist.getOptions().name || event.key === null) {
        if (event.newValue === null) useThemeStore.getState().setPreference("system");
        else void Promise.resolve(useThemeStore.persist.rehydrate()).then(applyTheme);
      }
    };
    media.addEventListener("change", applyTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      media.removeEventListener("change", applyTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return children;
}
