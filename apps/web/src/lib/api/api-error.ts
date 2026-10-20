import { isAxiosError } from "axios";
import { z } from "zod";

const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});

export type ApiError = {
  code: string;
  message: string;
  status?: number;
  requestId?: string;
};

export function normalizeApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) return { code: "UNKNOWN_ERROR", message: "Unexpected error" };
  const envelope = z.object({ error: apiErrorSchema }).safeParse(error.response?.data);
  const parsed = apiErrorSchema.safeParse(
    envelope.success ? envelope.data.error : error.response?.data,
  );
  return {
    status: error.response?.status,
    requestId:
      typeof error.response?.headers["x-request-id"] === "string"
        ? error.response.headers["x-request-id"]
        : undefined,
    ...(parsed.success
      ? parsed.data
      : { code: error.response ? "HTTP_ERROR" : "NETWORK_ERROR", message: error.message }),
  };
}
