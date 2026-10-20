"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function EditorDialog({
  title,
  description,
  busy,
  onClose,
  children,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("Demo");
  const [returnFocus] = useState(() =>
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus?.isConnected) returnFocus.focus();
            else document.getElementById("module-title")?.focus();
          }}
          className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-9/10 max-w-xl -translate-y-1/2 overflow-y-auto rounded-3xl border bg-card p-6 shadow-xl outline-none"
        >
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-normal">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-xs leading-6 text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              aria-label={t("close")}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
