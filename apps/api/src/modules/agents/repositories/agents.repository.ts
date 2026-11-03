import type { AgentActor, AgentConfiguration, AgentInput } from "../models/agent.js";

export const AGENTS_REPOSITORY = Symbol("AgentsRepository");

export interface IAgentsRepository {
  getConfiguration(actor: AgentActor): Promise<AgentConfiguration | null>;
  saveConfiguration(actor: AgentActor, input: AgentInput): Promise<AgentConfiguration>;
}
