import { z } from "zod";

export const envelope = (data: z.ZodType) => z.object({ data });
