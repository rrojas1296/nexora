import { randomUUID } from "node:crypto";
import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthError } from "../domain/auth.js";

const errors: Record<number, { code: string; message: string }> = {
  400: { code: "INVALID_REQUEST", message: "Invalid request." },
  401: { code: "UNAUTHORIZED", message: "Authentication failed." },
  403: { code: "FORBIDDEN", message: "Request not allowed." },
  404: { code: "NOT_FOUND", message: "Resource not found." },
  409: { code: "CONFLICT", message: "Unable to complete request." },
  413: { code: "PAYLOAD_TOO_LARGE", message: "Request too large." },
  429: { code: "RATE_LIMITED", message: "Too many requests." },
  500: { code: "INTERNAL_ERROR", message: "Unable to complete request." },
};

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const authStatuses = {
      unauthorized: 401,
      forbidden: 403,
      conflict: 409,
      invalid: 400,
      incorrect_password: 400,
    };
    const oversizedBody =
      exception instanceof Error &&
      "type" in exception &&
      exception.type === "entity.too.large" &&
      "status" in exception &&
      exception.status === 413;
    const status =
      exception instanceof AuthError
        ? authStatuses[exception.code]
        : exception instanceof HttpException
          ? exception.getStatus()
          : oversizedBody
            ? 413
            : 500;
    if (status >= 500) {
      const incident = randomUUID();
      // Never log raw infrastructure errors: drivers may embed SQL, credentials or token hashes.
      this.logger.error(`Unexpected request failure; incident=${incident}`);
      response.setHeader("X-Request-Id", incident);
    }
    response.setHeader("Cache-Control", "no-store");
    const error =
      exception instanceof AuthError && exception.code === "incorrect_password"
        ? { code: "INCORRECT_PASSWORD", message: "Current password is incorrect." }
        : (errors[status] ?? errors[500]);
    response.status(status).json({ statusCode: status, error });
  }
}
