import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { internalApiUrl } from "@/lib/api/internal-url";
import { sessionResponseSchema } from "../schemas/session-schema";

// Deduplicate only within this server render. Never use a shared session cache.
export const readServerSession = cache(async () => {
  const jar = await cookies();
  const accessCookies = ["__Host-access", "dev-access"]
    .flatMap((name) => {
      const value = jar.get(name)?.value;
      return value ? [`${name}=${encodeURIComponent(value)}`] : [];
    })
    .join("; ");
  if (!accessCookies) return "anonymous" as const;
  try {
    const response = await fetch(`${internalApiUrl}/auth/me`, {
      headers: { Cookie: accessCookies, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401) return "anonymous" as const;
    if (!response.ok) return "unavailable" as const;
    sessionResponseSchema.parse(await response.json());
    return "authenticated" as const;
  } catch {
    return "unavailable" as const;
  }
});
