"use client";

import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { QueryState } from "@/features/demo/components/query-state";
import { AccountSecurityCard } from "@/features/auth/components/account-security-card";
import { SettingsForm } from "./settings-form";
import { WhatsappConnectionCard } from "@/features/whatsapp/components/whatsapp-connection-card";

export function SettingsScreen() {
  const query = useWorkspace();
  return (
    <div className="space-y-6">
      <AccountSecurityCard />
      <WhatsappConnectionCard />
      <QueryState
        pending={query.isPending}
        error={query.isError}
        retry={() => {
          void query.refetch();
        }}
      >
        {query.data ? <SettingsForm settings={query.data.settings} /> : null}
      </QueryState>
    </div>
  );
}
