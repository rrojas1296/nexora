import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UnauthorizedException,
  UseFilters,
} from "@nestjs/common";
import type { AuthRequest } from "../../auth/presentation/auth.request.js";
import { AgentsService } from "../application/agents.service.js";
import type { AgentActor } from "../domain/agent.js";
import { AgentsExceptionFilter } from "./agents-exception.filter.js";
import {
  agentBusinessIdSchema,
  agentInputSchema,
  parseAgentRequest as parse,
} from "./agents.dto.js";

function actor(request: AuthRequest): AgentActor {
  if (!request.auth) throw new UnauthorizedException();
  return {
    userId: request.auth.claims.sub,
    businessId: request.auth.claims.businessId,
    sessionId: request.auth.claims.sid,
  };
}

@Controller("businesses/:businessId/agents/configuration")
@UseFilters(AgentsExceptionFilter)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  async get(@Req() request: AuthRequest, @Param("businessId") businessId: string) {
    return {
      data: await this.agents.getConfiguration(
        actor(request),
        parse(agentBusinessIdSchema, businessId),
      ),
    };
  }

  @Put()
  async save(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.agents.saveConfiguration(
        actor(request),
        parse(agentBusinessIdSchema, businessId),
        parse(agentInputSchema, body),
      ),
    };
  }
}
