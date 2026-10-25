import { z } from "zod";
import {
  productInputSchema,
  clientInputSchema,
  agentSchema,
  settingsSchema,
  messageInputSchema,
  orderStatuses,
  orderInputSchema,
  conversationStatuses,
} from "./workspace-schema";

const id = z.string().min(1);
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("product.save"), id: id.optional(), input: productInputSchema }),
  z.object({ type: z.literal("product.delete"), id }),
  z.object({ type: z.literal("client.save"), id: id.optional(), input: clientInputSchema }),
  z.object({ type: z.literal("order.status"), id, status: z.enum(orderStatuses) }),
  z.object({ type: z.literal("order.save"), id: id.optional(), input: orderInputSchema }),
  z.object({
    type: z.literal("conversation.update"),
    id,
    status: z.enum(conversationStatuses),
    assignedTo: z.enum(["agent", "human"]),
  }),
  z.object({ type: z.literal("message.send"), id, input: messageInputSchema }),
  z.object({ type: z.literal("agent.save"), input: agentSchema }),
  z.object({ type: z.literal("settings.save"), input: settingsSchema }),
]);
export type WorkspaceCommand = z.infer<typeof commandSchema>;
