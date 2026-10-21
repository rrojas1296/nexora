import { z } from "zod";

export const tones = ["friendly", "professional", "concise"] as const;
export const agentInputSchema = z.object({
  name: z.string().trim().min(2, "name").max(100, "name"),
  tone: z.enum(tones, { error: "required" }),
  instructions: z.string().trim().min(20, "instructions").max(2000, "instructions"),
  greeting: z.string().trim().min(5, "greeting").max(300, "greeting"),
  enabled: z.boolean(),
});
// Existing rows may predate the editing policy. Validate transport types without
// hiding persisted content; new saves still pass the complete input schema.
export const agentSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  tone: z.enum(tones),
  instructions: z.string(),
  greeting: z.string(),
  enabled: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const agentResponseSchema = z.object({ data: agentSchema });
export const agentReadResponseSchema = z.object({ data: agentSchema.nullable() });
export type AgentInput = z.infer<typeof agentInputSchema>;
export type AgentConfiguration = z.infer<typeof agentSchema>;
export type AgentScope = { userId: string; businessId: string };

export const emptyAgent: AgentInput = {
  name: "",
  tone: "friendly",
  instructions: "",
  greeting: "",
  enabled: false,
};
