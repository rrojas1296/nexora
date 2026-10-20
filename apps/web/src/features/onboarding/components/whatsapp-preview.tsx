"use client";

import { MessageCircleMore, Unplug } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function WhatsappPreview({
  simulated,
  onChange,
}: {
  simulated: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTranslations("Onboarding");
  return (
    <section className="mt-6 rounded-2xl border bg-muted/40 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <MessageCircleMore className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm">{t("whatsappTitle")}</h3>
          <p className="mt-2 max-w-lg text-xs leading-6 text-muted-foreground">
            {t("whatsappDescription")}
          </p>
        </div>
      </div>
      <output className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Unplug className="size-3.5" aria-hidden="true" />
        {t(simulated ? "previewReady" : "notConnected")}
      </output>
      <Button type="button" variant="outline" onClick={() => onChange(!simulated)}>
        {t(simulated ? "resetPreview" : "simulateConnection")}
      </Button>
    </section>
  );
}
