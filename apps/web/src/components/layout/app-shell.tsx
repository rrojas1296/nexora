import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export async function AppShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Shell");
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="min-h-22" aria-busy="true" />}>
          <Header />
        </Suspense>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-357 flex-1 space-y-5 px-4 pb-8 outline-none sm:px-6 lg:px-7 xl:px-8"
        >
          {children}
        </main>
        <footer className="px-5 pb-5 text-center text-xs leading-5 text-muted-foreground">
          {t("demoNotice")}
        </footer>
      </div>
    </div>
  );
}
