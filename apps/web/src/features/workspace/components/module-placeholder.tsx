import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ModuleKey } from "@/components/layout/navigation";
import { Link } from "@/i18n/navigation";

export async function ModulePlaceholder({ module }: { module: ModuleKey }) {
  const t = await getTranslations("Modules");
  const nav = await getTranslations("Nav");
  return (
    <>
      <h1 className="text-sm font-normal text-muted-foreground">{nav(module)}</h1>
      <section className="rounded-3xl border bg-card/70 px-6 py-16 text-center sm:py-24">
        <Construction
          className="mx-auto mb-6 size-9 text-secondary-foreground"
          strokeWidth={1.4}
          aria-hidden="true"
        />
        <h2 className="text-2xl font-normal tracking-tight">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard">{t("back")}</Link>
        </Button>
        <p className="mt-8 text-xs text-muted-foreground">{t("notice")}</p>
      </section>
    </>
  );
}
