import { AgentError, type AgentActor, type AgentInput } from "../models/agent.js";
import type { AgentsRepository } from "../repositories/agents.repository.js";

export class AgentsService {
  constructor(private readonly repository: AgentsRepository) {}

  private scope(actor: AgentActor, businessId: string): AgentActor {
    if (actor.businessId !== businessId) throw new AgentError("AGENT_FORBIDDEN");
    return actor;
  }

  getConfiguration(actor: AgentActor, businessId: string) {
    return this.repository.getConfiguration(this.scope(actor, businessId));
  }

  saveConfiguration(actor: AgentActor, businessId: string, input: AgentInput) {
    return this.repository.saveConfiguration(this.scope(actor, businessId), input);
  }
}
