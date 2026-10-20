import type { OnboardingValues } from "../schemas/onboarding-schema";

export const onboardingSteps = [
  { key: "business", fields: ["businessName", "businessDescription"] },
  { key: "store", fields: ["storeName", "currency", "timezone", "openingTime", "closingTime"] },
  { key: "agent", fields: ["agentName", "agentTone", "agentInstructions"] },
  { key: "whatsapp", fields: ["whatsappPhone", "whatsappPreview"] },
  { key: "summary", fields: [] },
] as const satisfies readonly { key: string; fields: readonly (keyof OnboardingValues)[] }[];
