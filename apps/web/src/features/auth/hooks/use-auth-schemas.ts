"use client";

import { useTranslations } from "next-intl";
import { createAuthSchemas } from "../schemas/auth-schema";

export function useAuthSchemas() {
  const t = useTranslations("Auth.validation");
  return createAuthSchemas({
    email: t("email"),
    password: t("password"),
    name: t("name"),
    confirm: t("confirm"),
  });
}
