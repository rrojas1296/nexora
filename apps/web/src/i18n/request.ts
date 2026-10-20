import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const catalogs = {
  es: async () => {
    const [base, commerce] = await Promise.all([
      import("./messages/es.json"),
      import("./messages/commerce/es.json"),
    ]);
    return { ...base.default, ...commerce.default };
  },
  en: async () => {
    const [base, commerce] = await Promise.all([
      import("./messages/en.json"),
      import("./messages/commerce/en.json"),
    ]);
    return { ...base.default, ...commerce.default };
  },
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  return { locale, messages: await catalogs[locale]() };
});
