"use client";

import { useState, type ReactNode } from "react";
import { Copy, ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function DeliveryAddressCard({
  address,
  reference = "",
  latitude,
  longitude,
  title,
  children,
}: {
  address: string;
  reference?: string;
  latitude: number | null;
  longitude: number | null;
  title?: string;
  children?: ReactNode;
}) {
  const t = useTranslations("Delivery");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const hasCoordinates =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  const coordinates = hasCoordinates ? `${latitude}, ${longitude}` : "";
  const query = coordinates || address.trim();
  const mapsUrl = query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : "";
  const copyText = [address.trim(), reference.trim()].filter(Boolean).join("\n") || mapsUrl;
  return (
    <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 text-card-foreground sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-2">
          <h3 className="text-sm font-medium">{title ?? t("destination")}</h3>
          {address.trim() ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">{address}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("sharedLocation")}</p>
          )}
          {reference.trim() ? (
            <p className="whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">
              {reference}
            </p>
          ) : null}
        </div>
      </div>
      {children}
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {query ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t("openMaps")}
              <span className="sr-only">{t("newTab")}</span>
            </a>
          </Button>
        ) : null}
        {copyText ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(copyText);
                setCopyStatus("copied");
              } catch {
                setCopyStatus("error");
              }
            }}
          >
            <Copy className="size-4" aria-hidden="true" />
            {t("copyAddress")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {t(hasCoordinates ? "mapsCoordinatesHint" : "mapsSearchHint")}
      </p>
      <output className="block text-xs text-muted-foreground">
        {copyStatus === "copied" ? t("copied") : copyStatus === "error" ? t("copyError") : ""}
      </output>
    </section>
  );
}
