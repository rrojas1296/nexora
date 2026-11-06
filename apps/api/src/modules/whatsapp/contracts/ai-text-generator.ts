import type { AiToolDefinition, AiToolExchange, AiTurnResult } from "./ai-tools.js";

// Provider-neutral boundary: business orchestration never receives SDK response objects.
export const AI_TEXT_GENERATOR = Symbol("AiTextGenerator");

export interface IAiTextGenerator {
  readonly provider: string;
  readonly model: string;
  generate(
    input: AiReplyInput,
    tools: AiToolDefinition[],
    exchanges: AiToolExchange[],
    timeoutMs: number,
  ): Promise<AiTurnResult>;
}

export interface AiReplyInput {
  businessName: string;
  context: string;
  agentName: string;
  tone: string;
  responseLanguage: "es" | "en";
  instructions: string;
  greeting: string;
  firstReply: boolean;
  history: { role: "user" | "assistant"; text: string }[];
}

export class AiGenerationError extends Error {
  constructor(readonly code: "UNAVAILABLE" | "INVALID_RESPONSE" | "NOT_CONFIGURED") {
    super(code);
  }
}
