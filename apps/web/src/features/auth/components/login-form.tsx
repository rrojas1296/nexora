"use client";

import { Suspense } from "react";
import { PasswordChangedNotice } from "./password-changed-notice";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Link } from "@/i18n/navigation";
import { useAuthError } from "../hooks/use-auth-error";
import { useAuthSchemas } from "../hooks/use-auth-schemas";
import { useAuthAccess } from "../hooks/use-auth-access";
import type { LoginValues } from "../schemas/auth-schema";
import { authService } from "../services/auth-service";

export function LoginForm() {
  const t = useTranslations("Auth");
  const { login } = useAuthSchemas();
  const acceptSession = useAuthAccess();
  const errorMessage = useAuthError();
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(login),
    defaultValues: { email: "", password: "" },
  });
  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await authService.login(values);
      resetField("password");
      await acceptSession(session, "/dashboard");
    } catch (error) {
      resetField("password");
      setError("root", { message: errorMessage(error) });
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
      <Suspense fallback={null}>
        <PasswordChangedNotice />
      </Suspense>
      <fieldset disabled={isSubmitting} className="space-y-5">
        <legend className="sr-only">{t("loginTitle")}</legend>
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
          autoComplete="current-password"
          maxLength={72}
          {...register("password")}
          error={errors.password?.message}
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
          {t(isSubmitting ? "pending" : "loginAction")}
        </Button>
      </fieldset>
      <p className="text-center text-xs">
        <Link
          href="/change-password"
          className="rounded text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("changePasswordTitle")}
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="rounded text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("registerAction")}
        </Link>
      </p>
    </form>
  );
}
