import { mockDelay } from "@/lib/mocks/mock-delay";
import { createOnboardingSchema, type OnboardingValues } from "../schemas/onboarding-schema";

const schema = createOnboardingSchema({
  name: "name",
  description: "description",
  instructions: "instructions",
  required: "required",
  phone: "phone",
  hours: "hours",
});

export const mockOnboardingService = {
  async complete(
    draft: OnboardingValues,
    simulateFailure: boolean,
    signal: AbortSignal,
  ): Promise<OnboardingValues> {
    await mockDelay(800, signal);
    if (simulateFailure) throw new Error("DEMO_ONBOARDING_FAILURE");
    // This validates the mock boundary; it does not persist data or provision a tenant.
    return schema.parse(draft);
  },
};
