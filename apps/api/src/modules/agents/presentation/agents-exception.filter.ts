import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { AgentError } from "../domain/agent.js";

const statuses = { AGENT_FORBIDDEN: 403, AGENT_CONFIGURATION_CONFLICT: 409 } as const;

@Catch(AgentError)
export class AgentsExceptionFilter implements ExceptionFilter<AgentError> {
  catch(error: AgentError, host: ArgumentsHost) {
    const statusCode = statuses[error.code];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({
        statusCode,
        error: { code: error.code, message: "Unable to complete agent configuration request." },
      });
  }
}
