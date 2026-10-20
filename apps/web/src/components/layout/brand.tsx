import { MessageCircleMore } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

export function Brand({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Common");
  return (
    <Link
      href="/dashboard"
      aria-label={t("brand")}
      className="flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
        <MessageCircleMore className="size-5" aria-hidden="true" />
      </span>
      <span className={cn("text-base font-medium tracking-tight text-white", compact && "sr-only")}>
        {t("brand")}
      </span>
    </Link>
  );
}
