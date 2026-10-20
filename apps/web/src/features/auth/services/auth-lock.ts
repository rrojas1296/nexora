"use client";

let queue: Promise<unknown> = Promise.resolve();

export function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  const run = () =>
    navigator.locks ? navigator.locks.request("conversa-auth", operation) : operation();
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

const refreshMarker = "conversa-auth-refresh-pending";

export function beginRefresh(): boolean {
  // Fail closed without cross-tab coordination or durable uncertainty tracking.
  // The marker is only a boolean, never a cookie, JWT, CSRF token or profile.
  if (!navigator.locks) return false;
  try {
    if (localStorage.getItem(refreshMarker)) return false;
    localStorage.setItem(refreshMarker, "1");
    return true;
  } catch {
    return false;
  }
}

export function clearRefreshMarker() {
  try {
    localStorage.removeItem(refreshMarker);
  } catch {
    /* Storage may be disabled. */
  }
}
