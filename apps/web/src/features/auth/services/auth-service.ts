"use client";

import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/api-error";
import type { ChangePasswordValues } from "../schemas/change-password-schema";
import type { LoginValues, RegisterValues } from "../schemas/auth-schema";
import { sessionResponseSchema, type Session } from "../schemas/session-schema";
import { beginRefresh, clearRefreshMarker, withAuthLock } from "./auth-lock";

async function csrfHeaders() {
  const response = await apiClient.get("/auth/csrf");
  const { data } = z
    .object({ data: z.object({ csrfToken: z.string().min(1) }) })
    .parse(response.data);
  return { "X-CSRF-Token": data.csrfToken };
}

async function readSession(): Promise<Session | null> {
  try {
    const response = await apiClient.get("/auth/me");
    return sessionResponseSchema.parse(response.data).data;
  } catch (error) {
    if (normalizeApiError(error).status === 401) return null;
    throw error;
  }
}

async function restoreSession(): Promise<Session | null> {
  // Recheck AFTER obtaining the cross-tab lock: another tab may have refreshed.
  const session = await readSession();
  if (session) {
    clearRefreshMarker();
    return session;
  }
  const headers = await csrfHeaders();
  if (!beginRefresh()) return null;
  try {
    await apiClient.post("/auth/refresh", undefined, { headers });
    clearRefreshMarker();
  } catch (error) {
    // Never retry an uncertain refresh. A subsequent login clears the marker.
    const { status } = normalizeApiError(error);
    if (status === 401 || status === 403) return null;
    throw error;
  }
  return readSession();
}

export function withAuthenticatedSession<T>(
  operation: (session: Session, headers: Record<string, string>) => Promise<T>,
): Promise<T> {
  return withAuthLock(async () => {
    const session = await restoreSession();
    if (!session) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
    return operation(session, await csrfHeaders());
  });
}

export const authService = {
  current: () => withAuthLock(restoreSession),
  login: (values: LoginValues) =>
    withAuthLock(async () => {
      const headers = await csrfHeaders();
      const response = await apiClient.post(
        "/auth/login",
        {
          email: values.email,
          password: values.password,
        },
        { headers },
      );
      clearRefreshMarker();
      return sessionResponseSchema.parse(response.data).data;
    }),
  register: (values: RegisterValues) =>
    withAuthLock(async () => {
      const headers = await csrfHeaders();
      const response = await apiClient.post(
        "/auth/register",
        {
          name: values.name,
          email: values.email,
          password: values.password,
          businessName: values.businessName,
        },
        { headers },
      );
      clearRefreshMarker();
      return sessionResponseSchema.parse(response.data).data;
    }),
  changePassword: (userId: string, values: ChangePasswordValues, signal: AbortSignal) =>
    withAuthenticatedSession(async (session, headers) => {
      signal.throwIfAborted();
      if (session.user.id !== userId) throw new Error("SESSION_CHANGED");
      // Confirmation is local only. Never replay this mutation after an uncertain response.
      await apiClient.post(
        "/auth/change-password",
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        { headers, signal },
      );
      clearRefreshMarker();
    }),
  changePasswordWithCredentials: (values: ChangePasswordValues, signal: AbortSignal) =>
    withAuthLock(async () => {
      signal.throwIfAborted();
      const headers = await csrfHeaders();
      signal.throwIfAborted();
      await apiClient.post(
        "/auth/change-password-with-credentials",
        {
          email: values.email,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        { headers, signal },
      );
      clearRefreshMarker();
    }),
  logout: (all = false) =>
    withAuthLock(async () => {
      if (all) await restoreSession();
      const headers = await csrfHeaders();
      await apiClient.post(all ? "/auth/logout-all" : "/auth/logout", undefined, { headers });
      clearRefreshMarker();
    }),
};
