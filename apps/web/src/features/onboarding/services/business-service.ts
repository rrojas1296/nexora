import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { withAuthenticatedSession } from "@/features/auth/services/auth-service";

const businessResponseSchema = z.object({
  data: z.object({ id: z.uuid(), name: z.string().min(1).max(120), slug: z.string() }),
});

export type BusinessUpdate = {
  userId: string;
  businessId: string;
  name: string;
  signal: AbortSignal;
};

export const businessService = {
  updateName: ({ userId, businessId, name, signal }: BusinessUpdate) =>
    withAuthenticatedSession(async (session, headers) => {
      signal.throwIfAborted();
      if (session.user.id !== userId || session.activeBusinessId !== businessId)
        throw new Error("SESSION_CHANGED");
      // Refresh may happen before this call, but a mutation is never replayed.
      const response = await apiClient.patch(
        `/businesses/${businessId}`,
        { name },
        { headers, signal },
      );
      signal.throwIfAborted();
      const { data } = businessResponseSchema.parse(response.data);
      if (data.id !== businessId) throw new Error("BUSINESS_RESPONSE_MISMATCH");
      return data;
    }),
};
