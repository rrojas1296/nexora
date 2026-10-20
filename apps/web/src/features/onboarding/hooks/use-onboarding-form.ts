"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { isMockRequestCancelled } from "@/lib/mocks/mock-delay";
import { useMockRequest } from "@/lib/mocks/use-mock-request";
import { createOnboardingSchema, type OnboardingValues } from "../schemas/onboarding-schema";
import { useOnboardingStore } from "../stores/onboarding-store";
import { onboardingSteps } from "../types/onboarding-steps";
import { mockOnboardingService } from "../services/mock-onboarding-service";

export function useOnboardingForm() {
  const v = useTranslations("Onboarding.validation");
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const request = useMockRequest();
  const step = useOnboardingStore((state) => state.step);
  const setStep = useOnboardingStore((state) => state.setStep);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [initialDraft] = useState(() => useOnboardingStore.getState().draft);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const schema = createOnboardingSchema({
    name: v("name"),
    description: v("description"),
    instructions: v("instructions"),
    required: v("required"),
    phone: v("phone"),
    hours: v("hours"),
  });
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    defaultValues: initialDraft,
  });
  const { subscribe, getValues } = form;

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => updateDraft(values),
      }),
    [subscribe, updateDraft],
  );

  const showInvalidStep = (errors: FieldErrors<OnboardingValues>) => {
    const invalidStep = onboardingSteps.findIndex(({ fields }) =>
      fields.some((field) => errors[field]),
    );
    if (invalidStep >= 0) setStep(invalidStep);
  };
  const finish = form.handleSubmit(async (values) => {
    try {
      const result = await request((signal) =>
        mockOnboardingService.complete(values, simulateFailure, signal),
      );
      useOnboardingStore.getState().complete(result);
      router.push("/dashboard");
    } catch (error) {
      if (isMockRequestCancelled(error)) return;
      form.setError("root", { message: t("saveError") });
    }
  }, showInvalidStep);
  const next = async () => {
    const current = onboardingSteps[step];
    if (!current) return;
    const valid = await form.trigger([...current.fields], { shouldFocus: true });
    if (valid) {
      updateDraft(getValues());
      setStep(step + 1);
    }
  };
  return { form, step, setStep, next, finish, simulateFailure, setSimulateFailure };
}
