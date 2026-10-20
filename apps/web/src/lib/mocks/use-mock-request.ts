"use client";

import { useEffect, useRef } from "react";

// Prevent an abandoned demo request from changing session, progress or route.
export function useMockRequest() {
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return async <T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    const result = await request(current.signal);
    current.signal.throwIfAborted();
    return result;
  };
}
