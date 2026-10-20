"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Link } from "@/i18n/navigation";
import { isMockRequestCancelled } from "@/lib/mocks/mock-delay";
import { useMockRequest } from "@/lib/mocks/use-mock-request";
import { useAuthSchemas } from "../hooks/use-auth-schemas";
import { useDemoAccess } from "../hooks/use-demo-access";
import type { RegisterValues } from "../schemas/auth-schema";
import { DemoAuthError, mockAuthService } from "../services/mock-auth-service";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const schemas = useAuthSchemas();
  const acceptSession = useDemoAccess();
  const request = useMockRequest();
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schemas.register),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await request((signal) => mockAuthService.register(values, signal));
      resetField("password");
      resetField("confirmPassword");
      acceptSession(session);
    } catch (error) {
      if (isMockRequestCancelled(error)) return;
      setError("root", {
        message: error instanceof DemoAuthError ? t("errors.emailTaken") : t("errors.unexpected"),
      });
    }
  });
  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="space-y-5"
      aria-busy={isSubmitting}
    >
      <fieldset disabled={isSubmitting} className="space-y-4">
        <legend className="sr-only">{t("registerTitle")}</legend>
        <InputField
          label={t("name")}
          autoComplete="name"
          maxLength={80}
          {...register("name")}
          error={errors.name?.message}
        />
        <InputField
          label={t("email")}
          type="email"
          autoComplete="email"
          maxLength={254}
          {...register("email")}
          error={errors.email?.message}
        />
        <InputField
          label={t("password")}
          type="password"
          autoComplete="new-password"
          maxLength={128}
          {...register("password")}
          error={errors.password?.message}
          hint={t("passwordHint")}
        />
        <InputField
          label={t("confirmPassword")}
          type="password"
          autoComplete="new-password"
          maxLength={128}
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        {errors.root ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
          >
            {errors.root.message}
          </p>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
          {isSubmitting ? (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
          {t(isSubmitting ? "pending" : "registerAction")}
        </Button>
      </fieldset>
      <p className="text-center text-xs text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="rounded text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("loginAction")}
        </Link>
      </p>
    </form>
  );
}
