import { Body, Controller, Get, Param, Put, Req, UseFilters } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { agentResponse, nullableAgentResponse } from "../dto/agents-responses.dto.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import { AgentsService } from "../services/agents.service.js";
import { AgentsExceptionFilter } from "../filters/agents-exception.filter.js";
import {
  agentBusinessIdSchema,
  agentInputSchema,
  parseAgentRequest as parse,
} from "../dto/agents.dto.js";

@ApiTags("Agente")
@Controller("businesses/:businessId/agents/configuration")
@UseFilters(AgentsExceptionFilter)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @ApiRoute({
    summary: "Consultar configuración general del agente",
    params: ["businessId"],
    response: nullableAgentResponse,
    description:
      "Membresía activa. data=null si no existe configuración. No ejecuta IA ni conecta WhatsApp.",
    errors: { 409: "AGENT_CONFIGURATION_CONFLICT: configuración duplicada o reservada." },
  })
  async get(@Req() request: AuthRequest, @Param("businessId") businessId: string) {
    return {
      data: await this.agents.getConfiguration(
        getAuthenticatedActor(request),
        parse(agentBusinessIdSchema, businessId),
      ),
    };
  }

  @Put()
  @ApiRoute({
    summary: "Guardar configuración general del agente (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: agentInputSchema,
    response: agentResponse,
    description:
      "Reemplaza configuración completa. enabled es configuración, no inicia un agente IA.",
    errors: { 409: "AGENT_CONFIGURATION_CONFLICT." },
  })
  async save(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.agents.saveConfiguration(
        getAuthenticatedActor(request),
        parse(agentBusinessIdSchema, businessId),
        parse(agentInputSchema, body),
      ),
    };
  }
}
