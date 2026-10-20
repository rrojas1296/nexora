import { locale as getRootLocale } from "next/root-params";
import { getRequestConfig } from "next-intl/server";
import { validateLocale } from "./validate-locale";

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

export default getRequestConfig(async ({ locale: localeOverride }) => {
  const locale = validateLocale(localeOverride ?? (await getRootLocale()));
  return { locale, messages: await catalogs[locale](), timeZone: "UTC" };
});
