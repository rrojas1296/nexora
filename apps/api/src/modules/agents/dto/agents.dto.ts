import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export const agentBusinessIdSchema = z.uuid();
export const agentInputSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  tone: z.enum(["friendly", "professional", "concise"]),
  instructions: z.string().trim().max(2000),
  greeting: z.string().trim().min(5).max(300),
  enabled: z.boolean(),
});

export function parseAgentRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException();
  return result.data;
}
