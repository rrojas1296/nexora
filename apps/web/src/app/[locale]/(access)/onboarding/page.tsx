import { PageEntrance } from "@/components/ui/page-entrance";
import { Suspense } from "react";
import { ArrowUpLeft } from "lucide-react";
import { AuthenticatedContent } from "@/features/auth/components/authenticated-content";
import { SessionStatus } from "@/features/auth/components/session-status";
import { getTranslations } from "next-intl/server";
import { LocaleSelect } from "@/components/layout/locale-select";
import { ThemeSelect } from "@/components/layout/theme-select";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { Link } from "@/i18n/navigation";

export default async function OnboardingPage() {
  const t = await getTranslations("Onboarding");
  return (
    <Suspense fallback={<SessionStatus />}>
      <AuthenticatedContent allowWithoutBusiness>
        <div className="mx-auto min-h-dvh w-full max-w-357 bg-background">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5 sm:px-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUpLeft className="size-3.5" aria-hidden="true" />
              {t("dashboard")}
            </Link>
            <div className="flex gap-2">
              <LocaleSelect />
              <ThemeSelect />
            </div>
          </header>
          <PageEntrance
            as="main"
            id="main-content"
            tabIndex={-1}
            className="px-5 py-10 outline-none sm:px-8 sm:py-14 lg:px-12"
          >
            <div className="mb-10">
              <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">{t("title")}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <OnboardingWizard />
          </PageEntrance>
        </div>
      </AuthenticatedContent>
    </Suspense>
  );
}
