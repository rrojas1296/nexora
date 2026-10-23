"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/features/auth/hooks/use-session";
import { useAgent, useAgentAccess, useAgentMutation } from "@/features/agent/hooks/use-agent";
import { agentService } from "@/features/agent/services/agent-service";
import { isMockRequestCancelled } from "@/lib/mocks/mock-delay";
import { useMockRequest } from "@/lib/mocks/use-mock-request";
import { createOnboardingSchema, type OnboardingValues } from "../schemas/onboarding-schema";
import { useOnboardingStore } from "../stores/onboarding-store";
import { onboardingSteps } from "../types/onboarding-steps";
import { mockOnboardingService } from "../services/mock-onboarding-service";
import { useUpdateBusiness } from "./use-update-business";

export function useOnboardingForm() {
  const v = useTranslations("Onboarding.validation");
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const request = useMockRequest();
  const session = useSession().data;
  const updateBusiness = useUpdateBusiness();
  const agent = useAgent();
  const agentAccess = useAgentAccess();
  const saveAgent = useAgentMutation();
  const step = useOnboardingStore((state) => state.step);
  const setStep = useOnboardingStore((state) => state.setStep);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [initialDraft] = useState(() => {
    const draft = useOnboardingStore.getState().draft;
    const business = session?.memberships.find(
      (membership) => membership.businessId === session.activeBusinessId,
    )?.business;
    return { ...draft, businessName: draft.businessName || business?.name || "" };
  });
  const [simulateFailure, setSimulateFailure] = useState(false);
  const schema = createOnboardingSchema({
    name: v("name"),
    businessName: v("businessName"),
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
  const { subscribe, getValues, getFieldState, setValue } = form;
  const hasAgentDraft = !!(initialDraft.agentName || initialDraft.agentInstructions);

  useEffect(() => {
    if (hasAgentDraft || !agent.data) return;
    const saved = agent.data;
    const fields = {
      agentName: saved.name,
      agentTone: saved.tone,
      agentInstructions: saved.instructions,
    } as const;
    for (const name of ["agentName", "agentTone", "agentInstructions"] as const) {
      const state = getFieldState(name);
      if (!state.isDirty && !state.isTouched) setValue(name, fields[name]);
    }
  }, [agent.data, hasAgentDraft, getFieldState, setValue]);

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
    form.clearErrors("root");
    let savingAgent = false;
    try {
      if (!session) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
      const result = await request(async (signal) => {
        const draft = await mockOnboardingService.complete(values, simulateFailure, signal);
        const business = await updateBusiness.mutateAsync({
          userId: session.user.id,
          businessId: session.activeBusinessId,
          name: draft.businessName,
          signal,
        });
        savingAgent = true;
        signal.throwIfAborted();
        if (!agentAccess.scope || !agentAccess.isCurrent()) throw new Error("SESSION_CHANGED");
        // Preserve fields not edited in the wizard, using a fresh authorized read.
        const current = await agentService.get(agentAccess.scope, signal);
        signal.throwIfAborted();
        if (!agentAccess.isCurrent()) throw new Error("SESSION_CHANGED");
        await saveAgent.mutateAsync({
          name: draft.agentName,
          tone: draft.agentTone,
          instructions: draft.agentInstructions,
          greeting: current?.greeting ?? t("defaultAgentGreeting"),
          enabled: current?.enabled ?? false,
        });
        signal.throwIfAborted();
        if (!agentAccess.isCurrent()) throw new Error("SESSION_CHANGED");
        return { ...draft, businessName: business.name };
      });
      useOnboardingStore.getState().complete(result);
      router.push("/dashboard");
    } catch (error) {
      if (isMockRequestCancelled(error)) return;
      form.setError("root", { message: t(savingAgent ? "agentSaveError" : "saveError") });
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
