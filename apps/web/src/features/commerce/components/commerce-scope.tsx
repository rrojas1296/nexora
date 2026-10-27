"use client";
import type { ReactNode } from "react";
import { useCommerceAccess } from "../hooks/use-commerce";
export function CommerceScope({ children }: { children: ReactNode }) {
  const { scope } = useCommerceAccess();
  return scope ? <div key={`${scope.userId}:${scope.businessId}`}>{children}</div> : null;
}
