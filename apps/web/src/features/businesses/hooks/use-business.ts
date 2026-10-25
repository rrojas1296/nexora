"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks/use-session";
import { businessesService } from "../services/businesses-service";

export function useBusiness() {
  const { data: session } = useSession();
  const businessId = session?.activeBusinessId;
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["business", userId, businessId],
    queryFn: ({ signal }) => {
      if (!userId || !businessId) throw new Error("BUSINESS_REQUIRED");
      return businessesService.get({ userId, businessId }, signal);
    },
    enabled: !!businessId && !!userId,
    retry: false,
  });
}
