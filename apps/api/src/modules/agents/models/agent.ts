export class AgentError extends Error {
  constructor(readonly code: "AGENT_FORBIDDEN" | "AGENT_CONFIGURATION_CONFLICT") {
    super(code);
  }
}

export interface AgentActor {
  userId: string;
  businessId: string;
  sessionId: string;
}

export interface AgentInput {
  name: string;
  tone: "friendly" | "professional" | "concise";
  instructions: string;
  greeting: string;
  enabled: boolean;
}

export interface AgentConfiguration extends AgentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
