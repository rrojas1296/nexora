import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { z } from "zod";
import { EXTERNAL_WEBHOOK_ROUTE } from "../../../common/external-webhook.js";
import { Public } from "../../auth/decorators/public.decorator.js";
import { WhatsappInboxService } from "../services/whatsapp-inbox.service.js";
import { decodeWhatsappNotification, notificationSchema } from "../dto/whatsapp-notification.js";
import { WhatsappWebhookSecurity } from "../providers/whatsapp-webhook-security.js";
import { WhatsappSignatureGuard } from "../guards/whatsapp-signature.guard.js";

const verificationSchema = z.object({
  "hub.mode": z.literal("subscribe"),
  "hub.verify_token": z.string().min(1).max(256),
  "hub.challenge": z.string().min(1).max(1024),
});

@ApiTags("Webhook Meta")
@Controller("whatsapp/webhook")
export class WhatsappWebhookController {
  constructor(
    private readonly security: WhatsappWebhookSecurity,
    private readonly inbox: WhatsappInboxService,
  ) {}

  @Public()
  @Get()
  @ApiRoute({
    summary: "Verificar webhook de Meta",
    auth: "none",
    query: verificationSchema,
    queryRequired: true,
    response: z.string(),
    mediaType: "text/plain",
    description:
      "Público: compara verify token configurado y devuelve hub.challenge exacto como texto plano. No crea conexión de negocio.",
    errors: { 503: "Verify token no configurado." },
  })
  @Header("Content-Type", "text/plain; charset=utf-8")
  verify(@Query() query: unknown): string {
    const result = verificationSchema.safeParse(query);
    if (!result.success) throw new BadRequestException("Invalid webhook verification query.");
    if (!this.security.verifySubscriptionToken(result.data["hub.verify_token"])) {
      throw new ForbiddenException("Invalid webhook verification token.");
    }
    return result.data["hub.challenge"];
  }

  @Public()
  @Post()
  @ApiHeader({
    name: "X-Hub-Signature-256",
    required: true,
    schema: { type: "string", pattern: "^sha256=[a-fA-F0-9]{64}$" },
    description: "HMAC-SHA256 del raw body con el App Secret real de Meta. No es un Bearer token.",
  })
  @ApiRoute({
    summary: "Recibir evento firmado de Meta",
    auth: "none",
    body: notificationSchema,
    response: z.literal("EVENT_RECEIVED"),
    mediaType: "text/plain",
    description:
      "Hasta 1 MiB JSON sin compresión y 100 mensajes por notificación. Firma HMAC obligatoria; persiste mensajes entrantes deduplicados solo para números con conexión activa antes de responder 200. Los estados de entrega y otros eventos se descartan. Si falla la persistencia, no confirma y Meta puede reintentar. Exento de CSRF exclusivamente por firma.",
    errors: {
      415: "Content-Type no soportado.",
      503: "App Secret ausente o placeholder.",
    },
  })
  @SetMetadata(EXTERNAL_WEBHOOK_ROUTE, true)
  @UseGuards(WhatsappSignatureGuard)
  @HttpCode(200)
  @Header("Content-Type", "text/plain; charset=utf-8")
  async receive(@Body() body: unknown): Promise<string> {
    await this.inbox.receive(decodeWhatsappNotification(body));
    return "EVENT_RECEIVED";
  }
}
