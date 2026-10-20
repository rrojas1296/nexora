import type messages from "@/i18n/messages/es.json";
import type commerceMessages from "@/i18n/messages/commerce/es.json";
import type { Locale as AppLocale } from "@/i18n/routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages & typeof commerceMessages;
  }
}
