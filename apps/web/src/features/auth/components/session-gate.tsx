"use client";

import { Fragment, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { SessionReconciliationContext } from "../hooks/session-reconciliation-context";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "../hooks/use-session";
import { SessionStatus } from "./session-status";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function SessionGate({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const session = useSession();
  const reconciling = useContext(SessionReconciliationContext);
  const router = useRouter();
  const pathname = usePathname();
  const needsBusiness =
    !!session.data && !session.data.activeBusinessId && pathname !== "/onboarding";
  useEffect(() => {
    if (!session.isSuccess || session.isFetching) return;
    if (session.data === null) router.replace("/login");
    else if (needsBusiness) router.replace("/onboarding");
  }, [session.data, session.isSuccess, session.isFetching, needsBusiness, router]);
  // The browser query can resolve before this streamed boundary hydrates.
  // Match the server fallback first, regardless of the current query cache.
  if (!hydrated) return <SessionStatus />;
  if (session.isError)
    return (
      <SessionStatus
        failed
        retry={() => {
          void session.refetch();
        }}
      />
    );
  if (!session.data || needsBusiness) return <SessionStatus />;
  return (
    <>
      <div
        className={reconciling ? "hidden" : "contents"}
        inert={reconciling}
        aria-hidden={reconciling}
      >
        <Fragment key={`${session.data.user.id}:${session.data.activeBusinessId}`}>
          {children}
        </Fragment>
      </div>
      {reconciling ? <SessionStatus /> : null}
    </>
  );
}
