import { z } from "zod";

export const businessIdSchema = z.uuid();
export const updateBusinessSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
