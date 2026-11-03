import { Inject, Injectable } from "@nestjs/common";
import { AGENTS_REPOSITORY, type IAgentsRepository } from "../repositories/agents.repository.js";
import { AgentError, type AgentActor, type AgentInput } from "../models/agent.js";

@Injectable()
export class AgentsService {
  constructor(@Inject(AGENTS_REPOSITORY) private readonly repository: IAgentsRepository) {}

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
