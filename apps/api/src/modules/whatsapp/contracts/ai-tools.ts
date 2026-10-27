import type { AiReplyWork } from "./whatsapp-ai-store.js";

export interface AiToolCall {
  id: string;
  name: string;
  arguments: string;
}
export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
export interface AiToolExchange {
  call: AiToolCall;
  output: string;
}
export interface AiToolResult {
  data: Record<string, unknown>;
  finalText?: string;
}
export interface AiToolExecutor {
  readonly definitions: AiToolDefinition[];
  execute(work: AiReplyWork, call: AiToolCall): Promise<AiToolResult>;
}
export type AiTurnResult =
  | { type: "message"; text: string }
  | { type: "tool_calls"; calls: AiToolCall[] };
