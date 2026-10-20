import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  localeCookie: { name: "locale", sameSite: "lax", maxAge: 31_536_000 },
});

export type Locale = (typeof routing.locales)[number];
