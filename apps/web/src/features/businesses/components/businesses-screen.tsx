"use client";

import { Building2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/features/auth/hooks/use-session";
import { useSwitchBusiness } from "../hooks/use-switch-business";

export function BusinessesScreen() {
  const t = useTranslations("Businesses");
  const { data: session } = useSession();
  const mutation = useSwitchBusiness();
  if (!session) return null;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("intro")}</p>
        <Button asChild>
          <Link href="/businesses/new">
            <Plus className="size-4" aria-hidden="true" />
            {t("create")}
          </Link>
        </Button>
      </div>
      {mutation.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {t("switchError")}
        </p>
      ) : null}
      <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
        {session.memberships.map((entry) => (
          <li
            key={entry.businessId}
            className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6"
          >
            <div className="flex min-w-0 items-center gap-4">
              <Building2 className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="break-words text-base">{entry.business.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.businessId === session.activeBusinessId ? t("active") : t("available")}
                </p>
              </div>
            </div>
            {entry.businessId === session.activeBusinessId ? (
              <Button asChild variant="outline">
                <Link href="/businesses/configuration">{t("configuration")}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  if (window.confirm(t("switchConfirm"))) mutation.mutate(entry.businessId);
                }}
              >
                {t("open")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
