import { ArrowUpRight, Bot, MessageCircleMore, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LocaleSelect } from "@/components/layout/locale-select";
import { ThemeSelect } from "@/components/layout/theme-select";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export async function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const t = await getTranslations("Auth");
  const common = await getTranslations("Common");
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-357 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-2.5 rounded-lg text-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <MessageCircleMore
            className="size-7 text-sidebar-primary"
            strokeWidth={1.4}
            aria-hidden="true"
          />
          {common("brand")}
        </Link>
        <div className="py-12">
          <div className="mb-8 flex size-16 items-center justify-center rounded-2xl border border-sidebar-border bg-sidebar-accent">
            <Bot className="size-7 text-sidebar-ring" strokeWidth={1.3} aria-hidden="true" />
          </div>
          <h2 className="max-w-md text-4xl leading-tight font-normal tracking-tight xl:text-5xl">
            {t("introTitle")}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-sidebar-muted">
            {t("introDescription")}
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-sidebar-muted">
          <span className="size-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />
          {common("demo")}
        </p>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("explore")}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
          <div className="flex gap-2">
            <LocaleSelect />
            <ThemeSelect />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8 outline-none sm:px-8"
        >
          <p className="mb-3 text-xs text-secondary-foreground">{common("brand")}</p>
          <h1 className="text-3xl font-normal tracking-tight">
            {t(mode === "login" ? "loginTitle" : "registerTitle")}
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            {t(mode === "login" ? "loginDescription" : "registerDescription")}
          </p>
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
          <div className="mt-7 flex gap-2.5 rounded-2xl border bg-card/70 p-4">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-secondary-foreground"
              aria-hidden="true"
            />
            <div className="text-xs leading-5 text-muted-foreground">
              <p>{t("securityNotice")}</p>
              <p className="mt-2">{t("scopeNotice")}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
