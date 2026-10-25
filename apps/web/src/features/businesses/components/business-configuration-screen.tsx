"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/features/demo/components/query-state";
import { WhatsappConnectionCard } from "@/features/whatsapp/components/whatsapp-connection-card";
import { useBusiness } from "../hooks/use-business";
import { BusinessForm } from "./business-form";

export function BusinessConfigurationScreen() {
  const query = useBusiness();
  const t = useTranslations("Businesses");
  return (
    <QueryState
      pending={query.isPending}
      error={query.isError}
      retry={() => {
        void query.refetch();
      }}
    >
      {query.data ? (
        <div className="space-y-6">
          <BusinessForm key={query.data.id} business={query.data} />
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                if (window.confirm(t("reloadConfirm"))) window.location.reload();
              }}
            >
              {t("reload")}
            </Button>
          </div>
          <WhatsappConnectionCard />
        </div>
      ) : null}
    </QueryState>
  );
}
