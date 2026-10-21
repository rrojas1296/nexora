import { PageEntrance } from "@/components/ui/page-entrance";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChangePasswordForm } from "./change-password-form";

export async function ChangePasswordScreen() {
  const t = await getTranslations("PasswordChange");
  return (
    <PageEntrance className="space-y-7">
      <header>
        <Link
          href="/settings"
          className="mb-5 inline-flex items-center gap-2 rounded text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("back")}
        </Link>
        <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </header>
      <div className="grid items-start gap-8 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <ChangePasswordForm />
        </div>
        <aside className="space-y-4 px-1 py-2 xl:col-span-2 xl:px-4">
          <ShieldCheck className="size-7 text-primary" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-lg">{t("securityTitle")}</h2>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">{t("securityHint")}</p>
          <p className="max-w-md border-t pt-4 text-xs leading-6 text-muted-foreground">
            {t("recoveryHint")}
          </p>
        </aside>
      </div>
    </PageEntrance>
  );
}
