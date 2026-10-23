import {
  ForbiddenException,
  Injectable,
  UnsupportedMediaTypeException,
  type CanActivate,
  type ExecutionContext,
  type RawBodyRequest,
} from "@nestjs/common";
import type { Request } from "express";
import { WhatsappWebhookSecurity } from "../infrastructure/whatsapp-webhook-security.js";

@Injectable()
export class WhatsappSignatureGuard implements CanActivate {
  constructor(private readonly security: WhatsappWebhookSecurity) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    if (!request.is("application/json")) throw new UnsupportedMediaTypeException();
    if (
      !request.rawBody ||
      !this.security.verifySignature(request.rawBody, request.get("x-hub-signature-256"))
    ) {
      throw new ForbiddenException("Invalid webhook signature.");
    }
    return true;
  }
}
