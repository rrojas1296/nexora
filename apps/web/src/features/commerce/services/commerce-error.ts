import { normalizeApiError } from "@/lib/api/api-error";
export function commerceErrorKey(error: unknown) {
  const { status } = normalizeApiError(error);
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 400) return "validation";
  return "uncertain";
}
