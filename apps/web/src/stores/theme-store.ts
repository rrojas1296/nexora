"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import {
  isThemePreference,
  THEME_STORAGE_KEY,
  THEME_STORAGE_VERSION,
  type ThemePreference,
} from "@/lib/theme/theme-config";

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* Keep theme usable without persistence. */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* Storage may be disabled. */
    }
  },
};

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ preference: "system", setPreference: (preference) => set({ preference }) }), {
    name: THEME_STORAGE_KEY,
    version: THEME_STORAGE_VERSION,
    storage: createJSONStorage(() => safeStorage),
    partialize: ({ preference }) => ({ preference }),
    skipHydration: true,
    merge: (persisted, current) => {
      const saved = persisted as { preference?: unknown } | undefined;
      return {
        ...current,
        preference: isThemePreference(saved?.preference) ? saved.preference : "system",
      };
    },
  }),
);
