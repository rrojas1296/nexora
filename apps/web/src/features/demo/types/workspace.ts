import type { z } from "zod";
import type {
  productSchema,
  productInputSchema,
  clientSchema,
  clientInputSchema,
  storeSchema,
  storeInputSchema,
  orderSchema,
  orderInputSchema,
  conversationSchema,
  agentSchema,
  settingsSchema,
  workspaceSchema,
} from "../schemas/workspace-schema";

export type Product = z.infer<typeof productSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type Client = z.infer<typeof clientSchema>;
export type ClientInput = z.infer<typeof clientInputSchema>;
export type Store = z.infer<typeof storeSchema>;
export type StoreInput = z.infer<typeof storeInputSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type DemoScenario = "normal" | "empty" | "error";
