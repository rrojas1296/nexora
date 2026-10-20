import { isServer, QueryClient } from "@tanstack/react-query";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
