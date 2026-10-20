import { setRequestLocale } from "next-intl/server";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { validateLocale } from "@/i18n/validate-locale";

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(validateLocale(locale));
  return <AuthScreen mode="register" />;
}
