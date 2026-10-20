"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "../hooks/use-session";
import { SessionStatus } from "./session-status";

export function SessionRecovery({ unavailable = false }: { unavailable?: boolean }) {
  const session = useSession({ reconcileOnMount: true });
  const router = useRouter();
  useEffect(() => {
    if (!session.isFetchedAfterMount || !session.isSuccess || session.isFetching) return;
    if (!session.data) router.replace("/login");
    else if (!unavailable) router.refresh();
  }, [
    session.data,
    session.isSuccess,
    session.isFetching,
    session.isFetchedAfterMount,
    unavailable,
    router,
  ]);
  const failed =
    session.isFetchedAfterMount && (session.isError || (unavailable && !!session.data));
  return (
    <SessionStatus
      failed={failed}
      retry={() => {
        void session.refetch().then((result) => {
          if (result.isSuccess && result.data) router.refresh();
        });
      }}
    />
  );
}
