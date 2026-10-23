import { normalizeApiError } from "@/lib/api/api-error";

type WhatsappErrorKey =
  | "session"
  | "forbidden"
  | "notConfigured"
  | "conflict"
  | "rateLimit"
  | "expired"
  | "cancelled"
  | "unsupported"
  | "sdk"
  | "uncertain";

export function whatsappErrorKey(error: unknown): WhatsappErrorKey {
  const { status } = normalizeApiError(error);
  const reason = error instanceof Error ? error.message : "";
  if (status === 401 || ["SESSION_CHANGED", "AUTHENTICATED_SESSION_REQUIRED"].includes(reason))
    return "session";
  if (status === 403) return "forbidden";
  if (status === 503) return "notConfigured";
  if (status === 409) return "conflict";
  if (status === 429) return "rateLimit";
  if (status === 400 || reason === "WHATSAPP_SIGNUP_EXPIRED") return "expired";
  if (reason === "WHATSAPP_SIGNUP_CANCELLED") return "cancelled";
  if (reason === "WHATSAPP_SIGNUP_UNSUPPORTED") return "unsupported";
  if (reason === "WHATSAPP_SDK_UNAVAILABLE") return "sdk";
  return "uncertain";
}
