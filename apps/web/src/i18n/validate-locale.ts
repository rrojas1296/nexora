import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export function validateLocale(locale: string): (typeof routing.locales)[number] {
  if (!hasLocale(routing.locales, locale)) notFound();
  return locale;
}
