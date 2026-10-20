import { redirect } from "@/i18n/navigation";
import { validateLocale } from "@/i18n/validate-locale";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  redirect({ href: "/dashboard", locale: validateLocale(locale) });
}
