"use client";

import { useTranslations } from "next-intl";
import { normalizeApiError } from "@/lib/api/api-error";

export function useAuthError() {
  const t = useTranslations("Auth.errors");
  return (error: unknown) => {
    const { status, code } = normalizeApiError(error);
    if (status === 401) return t("rejected");
    if (status === 409) return t("conflict");
    if (status === 429) return t("rateLimited");
    if (status === 403) return t("forbidden");
    if (status === 400 || status === 413) return t("invalid");
    if (code === "NETWORK_ERROR") return t("network");
    return t("unexpected");
  };
}
