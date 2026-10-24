import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { WhatsappError, type WhatsappErrorCode } from "../models/whatsapp.js";

const statuses: Record<WhatsappErrorCode, number> = {
  WHATSAPP_FORBIDDEN: 403,
  WHATSAPP_NOT_CONNECTED: 409,
  WHATSAPP_REPLY_WINDOW_CLOSED: 409,
  WHATSAPP_CONNECTION_CONFLICT: 409,
  WHATSAPP_IDEMPOTENCY_CONFLICT: 409,
  WHATSAPP_ATTEMPT_NOT_FOUND: 404,
  WHATSAPP_CONVERSATION_NOT_FOUND: 404,
  WHATSAPP_NOT_CONFIGURED: 503,
  WHATSAPP_PROVIDER_UNAVAILABLE: 502,
  WHATSAPP_INVALID_CREDENTIALS: 422,
  WHATSAPP_SIGNUP_EXPIRED: 400,
  WHATSAPP_SIGNUP_INCOMPLETE: 422,
};

@Catch(WhatsappError)
export class WhatsappExceptionFilter implements ExceptionFilter<WhatsappError> {
  catch(error: WhatsappError, host: ArgumentsHost) {
    const statusCode = statuses[error.code];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({
        statusCode,
        error: { code: error.code, message: "Unable to complete WhatsApp request." },
      });
  }
}
