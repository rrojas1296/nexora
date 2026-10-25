"use client";

import { useId } from "react";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SelectField } from "@/components/ui/select-field";
import { useSession } from "@/features/auth/hooks/use-session";
import { useSwitchBusiness } from "@/features/businesses/hooks/use-switch-business";
import { cn } from "@/lib/utils/cn";

export function BusinessSelector({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const id = useId();
  const t = useTranslations("Businesses");
  const { data: session } = useSession();
  const mutation = useSwitchBusiness();
  const router = useRouter();
  if (!session) return null;
  const current = session.memberships.find(
    (entry) => entry.businessId === session.activeBusinessId,
  );
  return (
    <div
      className={cn("mx-4 mb-5 space-y-2 border-b border-sidebar-border pb-5", compact && "mx-2")}
    >
      <label
        htmlFor={id}
        className={cn("flex items-center gap-2 text-xs text-sidebar-muted", compact && "sr-only")}
      >
        <Building2 className="size-3.5" aria-hidden="true" />
        {t("active")}
      </label>
      <SelectField
        id={id}
        value={session.activeBusinessId ?? "none"}
        disabled={mutation.isPending}
        aria-label={t("active")}
        title={current?.business.name ?? t("title")}
        className="w-full min-w-0 border-sidebar-border bg-sidebar text-xs text-sidebar-foreground"
        options={[
          ...(!session.activeBusinessId ? [{ value: "none", label: t("choose") }] : []),
          ...session.memberships.map((entry) => ({
            value: entry.businessId,
            label: compact ? entry.business.name.slice(0, 2).toUpperCase() : entry.business.name,
          })),
          { value: "new", label: compact ? "+" : t("create") },
        ]}
        onValueChange={(id) => {
          if (id === "none" || id === session.activeBusinessId) return;
          if (!window.confirm(t("switchConfirm"))) return;
          if (id === "new") {
            router.push("/businesses/new");
            onNavigate?.();
            return;
          }
          mutation.mutate(id, { onSuccess: onNavigate });
        }}
      />
      {mutation.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {t("switchError")}
        </p>
      ) : null}
    </div>
  );
}
