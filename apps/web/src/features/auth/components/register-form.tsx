"use client";

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
import type { RegisterValues } from "../schemas/auth-schema";
import { authService } from "../services/auth-service";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const schemas = useAuthSchemas();
  const acceptSession = useAuthAccess();
  const errorMessage = useAuthError();
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schemas.register),
    defaultValues: { name: "", businessName: "", email: "", password: "", confirmPassword: "" },
  });
  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await authService.register(values);
      resetField("password");
      resetField("confirmPassword");
      await acceptSession(session, "/onboarding");
    } catch (error) {
      resetField("password");
      resetField("confirmPassword");
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
      <fieldset disabled={isSubmitting} className="space-y-4">
        <legend className="sr-only">{t("registerTitle")}</legend>
        <InputField
          label={t("name")}
          autoComplete="name"
          maxLength={100}
          {...register("name")}
          error={errors.name?.message}
        />
        <InputField
          label={t("businessName")}
          autoComplete="organization"
          maxLength={120}
          {...register("businessName")}
          error={errors.businessName?.message}
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
          maxLength={72}
          {...register("password")}
          error={errors.password?.message}
          hint={t("passwordHint")}
        />
        <InputField
          label={t("confirmPassword")}
          type="password"
          autoComplete="new-password"
          maxLength={72}
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
