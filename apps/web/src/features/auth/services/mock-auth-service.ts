import { mockDelay } from "@/lib/mocks/mock-delay";
import type { LoginValues, RegisterValues } from "../schemas/auth-schema";
import type { DemoSession } from "../types/demo-session";

export class DemoAuthError extends Error {
  constructor(public readonly code: "rejected" | "emailTaken") {
    super(code);
  }
}

// Deliberately not authentication. No network, account database, cookies or token.
export const mockAuthService = {
  async login({ email }: LoginValues, signal: AbortSignal): Promise<DemoSession> {
    await mockDelay(650, signal);
    if (email === "error@example.com") throw new DemoAuthError("rejected");
    return { id: "demo-user", name: "Demo", email };
  },
  async register({ name, email }: RegisterValues, signal: AbortSignal): Promise<DemoSession> {
    await mockDelay(650, signal);
    if (email === "error@example.com") throw new DemoAuthError("emailTaken");
    return { id: "demo-user", name, email };
  },
};
