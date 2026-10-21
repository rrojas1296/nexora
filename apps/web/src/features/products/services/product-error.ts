import { normalizeApiError } from "@/lib/api/api-error";

export function productErrorKey(error: unknown, mutation = false) {
  const { status, code } = normalizeApiError(error);
  if (code === "PRODUCT_SKU_EXISTS") return "sku";
  if (code === "PRODUCT_HAS_ORDERS") return "linked";
  if (
    status === 401 ||
    (error instanceof Error &&
      ["SESSION_CHANGED", "AUTHENTICATED_SESSION_REQUIRED"].includes(error.message))
  )
    return "session";
  if (status === 403 || (error instanceof Error && error.message === "PRODUCT_FORBIDDEN"))
    return "forbidden";
  if (status === 404) return "missing";
  if (status === 400) return "invalid";
  if (status === 409) return "conflict";
  if (status === 429) return "rateLimit";
  return mutation ? "uncertain" : "unexpected";
}
