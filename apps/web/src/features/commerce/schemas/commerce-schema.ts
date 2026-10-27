import { z } from "zod";
export const paginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  pages: z.number(),
});
export type CommerceScope = { userId: string; businessId: string };
export type CommerceFilters = {
  page: number;
  pageSize?: number;
  search?: string;
  status?: string;
  clientId?: string;
};
