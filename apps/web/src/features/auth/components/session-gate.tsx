"use client";

import { Fragment, useContext, useEffect, type ReactNode } from "react";
import { SessionReconciliationContext } from "../hooks/session-reconciliation-context";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "../hooks/use-session";
import { SessionStatus } from "./session-status";

export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const reconciling = useContext(SessionReconciliationContext);
  const router = useRouter();
  useEffect(() => {
    if (session.isSuccess && session.data === null && !session.isFetching) router.replace("/login");
  }, [session.data, session.isSuccess, session.isFetching, router]);
  if (session.isError)
    return (
      <SessionStatus
        failed
        retry={() => {
          void session.refetch();
        }}
      />
    );
  if (!session.data) return <SessionStatus />;
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
