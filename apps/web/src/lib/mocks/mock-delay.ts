export function mockDelay(duration: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Mock request cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, duration);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function isMockRequestCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
