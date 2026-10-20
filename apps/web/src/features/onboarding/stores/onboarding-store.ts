"use client";

import { create } from "zustand";
import type { OnboardingValues } from "../schemas/onboarding-schema";

export const initialOnboardingDraft: OnboardingValues = {
  businessName: "",
  businessDescription: "",
  storeName: "",
  currency: "USD",
  timezone: "America/Mexico_City",
  openingTime: "09:00",
  closingTime: "18:00",
  agentName: "",
  agentTone: "friendly",
  agentInstructions: "",
  whatsappPhone: "",
  whatsappPreview: false,
};

type OnboardingState = {
  draft: OnboardingValues;
  step: number;
  completed: boolean;
  updateDraft: (draft: OnboardingValues) => void;
  setStep: (step: number) => void;
  complete: (draft: OnboardingValues) => void;
  reset: () => void;
};

// Temporary in-memory progress, shared across locale changes. A reload clears it.
export const useOnboardingStore = create<OnboardingState>((set) => ({
  draft: { ...initialOnboardingDraft },
  step: 0,
  completed: false,
  updateDraft: (draft) => set({ draft, completed: false }),
  setStep: (step) => set({ step: Math.max(0, Math.min(4, step)) }),
  complete: (draft) => set({ draft, completed: true, step: 4 }),
  reset: () => set({ draft: { ...initialOnboardingDraft }, step: 0, completed: false }),
}));
