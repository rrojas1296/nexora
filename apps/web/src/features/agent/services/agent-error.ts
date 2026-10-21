import { normalizeApiError } from "@/lib/api/api-error";

export function agentErrorKey(error: unknown, mutation = false) {
  const { status } = normalizeApiError(error);
  if (
    status === 401 ||
    (error instanceof Error &&
      ["SESSION_CHANGED", "AUTHENTICATED_SESSION_REQUIRED"].includes(error.message))
  )
    return "session";
  if (status === 403 || (error instanceof Error && error.message === "AGENT_FORBIDDEN"))
    return "forbidden";
  if (status === 400) return "invalid";
  if (status === 409) return "conflict";
  if (status === 429) return "rateLimit";
  return mutation ? "uncertain" : "unexpected";
}
