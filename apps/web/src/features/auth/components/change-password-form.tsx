"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Link } from "@/i18n/navigation";
import { useChangePasswordForm } from "../hooks/use-change-password-form";

const passwordFields = [
  { name: "currentPassword", autoComplete: "current-password" },
  { name: "newPassword", autoComplete: "new-password" },
  { name: "confirmPassword", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm({ withCredentials = false }: { withCredentials?: boolean }) {
  const t = useTranslations("PasswordChange");
  const { form, onSubmit } = useChangePasswordForm(withCredentials);
  const [visible, setVisible] = useState(false);
  const { errors, isSubmitting } = form.formState;

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="rounded-3xl border bg-card p-5 sm:p-8"
    >
      <fieldset disabled={isSubmitting} className="space-y-5">
        <legend className="sr-only">{t("title")}</legend>
        {withCredentials ? (
          <InputField
            label={t("email")}
            type="email"
            autoComplete="username"
            maxLength={254}
            {...form.register("email")}
            error={errors.email?.message}
          />
        ) : null}
        {passwordFields.map(({ name, autoComplete }) => (
          <InputField
            key={name}
            label={t(name)}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            maxLength={72}
            hint={name === "newPassword" ? t("passwordHint") : undefined}
            {...form.register(name)}
            error={errors[name]?.message}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {t(visible ? "hide" : "show")}
        </Button>
        {errors.root ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs leading-6 text-destructive"
          >
            {errors.root.message}
          </p>
        ) : null}
        <p className="border-t pt-5 text-xs leading-6 text-muted-foreground">{t("logoutNotice")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={isSubmitting} className="h-11 w-full sm:w-auto">
            {isSubmitting ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <LockKeyhole aria-hidden="true" />
            )}
            {t(isSubmitting ? "pending" : "action")}
          </Button>
          <Link
            href="/login"
            className="rounded text-xs text-muted-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("login")}
          </Link>
        </div>
      </fieldset>
    </form>
  );
}
