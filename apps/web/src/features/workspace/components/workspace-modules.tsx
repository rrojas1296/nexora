import { ArrowUpRight, Bot, MessageSquare, Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function WorkspaceModules() {
  const t = await getTranslations("Workspace");
  const nav = await getTranslations("Nav");
  const common = await getTranslations("Common");
  const modules = [
    {
      key: "conversations",
      href: "/conversations",
      icon: MessageSquare,
      description: "conversationsDescription",
    },
    { key: "agent", href: "/agent", icon: Bot, description: "agentDescription" },
    { key: "products", href: "/products", icon: Package, description: "productsDescription" },
  ] as const;
  return (
    <section className="overflow-hidden rounded-3xl border bg-card/70">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div>
          <h2 className="text-lg font-normal tracking-tight">{t("modulesTitle")}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("modulesDescription")}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          {common("demo")}
        </span>
      </div>
      <ul className="divide-y border-t">
        {modules.map(({ key, href, icon: Icon, description }) => (
          <li key={key}>
            <Link
              href={href}
              className="group flex items-center gap-4 px-5 py-4 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 motion-reduce:transition-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background/60 text-muted-foreground group-hover:text-secondary-foreground">
                <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
                <h3 className="text-xs font-medium">{nav(key)}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground sm:col-span-2 sm:mt-0">
                  {t(description)}
                </p>
              </div>
              <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground md:block">
                {common("pending")}
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
