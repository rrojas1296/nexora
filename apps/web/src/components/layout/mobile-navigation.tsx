"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";
import { SidebarNavigation } from "./sidebar-navigation";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Shell");
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
          <Menu aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-4/5 flex-col rounded-r-3xl border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl outline-none lg:hidden">
          <Dialog.Title className="sr-only">{t("navigation")}</Dialog.Title>
          <Dialog.Description className="sr-only">{t("menuDescription")}</Dialog.Description>
          <div className="flex h-18 shrink-0 items-center justify-between px-5">
            <Brand />
            <Dialog.Close
              className="flex size-9 items-center justify-center rounded-md outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label={t("closeMenu")}
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto py-5">
            <SidebarNavigation onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
