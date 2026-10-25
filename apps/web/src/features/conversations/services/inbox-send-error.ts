import { normalizeApiError } from "@/lib/api/api-error";

type SendErrorKey =
  | "session"
  | "aiActive"
  | "forbidden"
  | "windowClosed"
  | "notConnected"
  | "rateLimit"
  | "invalid"
  | "notConfigured"
  | "uncertain";
export function inboxSendErrorKey(error: unknown): SendErrorKey {
  if (
    error instanceof Error &&
    ["SESSION_CHANGED", "AUTHENTICATED_SESSION_REQUIRED"].includes(error.message)
  )
    return "session";
  const { code, status } = normalizeApiError(error);
  if (status === 401) return "session";
  if (status === 403) return "forbidden";
  if (code === "WHATSAPP_AI_ACTIVE") return "aiActive";
  if (code === "WHATSAPP_REPLY_WINDOW_CLOSED") return "windowClosed";
  if (code === "WHATSAPP_NOT_CONNECTED") return "notConnected";
  if (code === "WHATSAPP_NOT_CONFIGURED") return "notConfigured";
  if (status === 429) return "rateLimit";
  if (status === 400) return "invalid";
  return "uncertain";
}
