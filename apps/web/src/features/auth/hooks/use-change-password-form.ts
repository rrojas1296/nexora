"use client";

import { useEffect, useRef, type FormEventHandler } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { normalizeApiError } from "@/lib/api/api-error";
import {
  createChangePasswordSchema,
  type ChangePasswordValues,
} from "../schemas/change-password-schema";
import { authService } from "../services/auth-service";
import { resetSessionData } from "../services/reset-session-data";
import { notifySessionChange } from "../services/session-events";
import { sessionQueryKey, useSession } from "./use-session";

const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function useChangePasswordForm(withCredentials = false) {
  const t = useTranslations("PasswordChange");
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(
      createChangePasswordSchema(
        {
          email: t("validation.email"),
          current: t("validation.current"),
          password: t("validation.password"),
          confirm: t("validation.confirm"),
          different: t("validation.different"),
        },
        withCredentials,
      ),
    ),
    defaultValues: { email: "", ...emptyPasswords },
  });

  async function leaveSession(changed: boolean) {
    await queryClient.cancelQueries({ queryKey: sessionQueryKey });
    resetSessionData(queryClient);
    queryClient.setQueryData(sessionQueryKey, null);
    notifySessionChange();
    // A fresh document drops all client state after this credentials boundary.
    window.location.replace(
      getPathname({ locale, href: changed ? "/login?passwordChanged=1" : "/login" }),
    );
  }

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) =>
    form.handleSubmit(async (values) => {
      if (!withCredentials && !session) return;
      const request = new AbortController();
      controller.current = request;
      try {
        if (withCredentials) {
          await authService.changePasswordWithCredentials(values, request.signal);
        } else if (session) {
          await authService.changePassword(session.user.id, values, request.signal);
        }
      } catch (error) {
        if (request.signal.aborted) return;
        form.reset({ email: values.email, ...emptyPasswords });
        const { status, code } = normalizeApiError(error);
        if (withCredentials && status === 401) {
          form.setError("root", { message: t("errors.credentials") });
          return;
        }
        if (
          status === 401 ||
          (error instanceof Error && error.message === "AUTHENTICATED_SESSION_REQUIRED")
        ) {
          await leaveSession(false);
          return;
        }
        if (error instanceof Error && error.message === "SESSION_CHANGED") {
          form.setError("root", { message: t("errors.sessionChanged") });
          void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
          return;
        }
        if (code === "INCORRECT_PASSWORD") {
          form.setError("currentPassword", { message: t("errors.current") }, { shouldFocus: true });
          return;
        }
        const message =
          status === 429
            ? t("errors.rateLimited")
            : status === 403
              ? t("errors.forbidden")
              : status === 400 || status === 413
                ? t("errors.invalid")
                : t("errors.uncertain");
        form.setError("root", { message });
        return;
      }
      if (request.signal.aborted) return;
      form.reset({ email: "", ...emptyPasswords });
      await leaveSession(true);
    })(event);

  return { form, onSubmit };
}
