import {
  Inject,
  ForbiddenException,
  Injectable,
  UnsupportedMediaTypeException,
  type CanActivate,
  type ExecutionContext,
  type RawBodyRequest,
} from "@nestjs/common";
import {
  WHATSAPP_WEBHOOK_SECURITY,
  type IWhatsappWebhookSecurity,
} from "../contracts/whatsapp-webhook-security.js";
import type { Request } from "express";

@Injectable()
export class WhatsappSignatureGuard implements CanActivate {
  constructor(
    @Inject(WHATSAPP_WEBHOOK_SECURITY) private readonly security: IWhatsappWebhookSecurity,
  ) {}

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
