import type { AgentActor, AgentConfiguration, AgentInput } from "../models/agent.js";

export interface AgentsRepository {
  getConfiguration(actor: AgentActor): Promise<AgentConfiguration | null>;
  saveConfiguration(actor: AgentActor, input: AgentInput): Promise<AgentConfiguration>;
}
