import { setRequestLocale } from "next-intl/server";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { validateLocale } from "@/i18n/validate-locale";

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(validateLocale(locale));
  return <AuthScreen mode="login" />;
}
