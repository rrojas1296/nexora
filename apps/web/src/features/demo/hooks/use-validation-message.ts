"use client";

import { useTranslations } from "next-intl";
const validationKeys = [
  "name",
  "text",
  "sku",
  "price",
  "stock",
  "email",
  "phone",
  "address",
  "required",
  "message",
  "instructions",
  "greeting",
  "imageUrl",
] as const;
export function useValidationMessage() {
  const t = useTranslations("Demo.validation");
  return (error?: { message?: string }) =>
    error ? t(validationKeys.find((key) => key === error.message) ?? "required") : undefined;
}
