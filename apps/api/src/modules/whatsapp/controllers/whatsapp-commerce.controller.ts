import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { envelope } from "../../../common/documentation/response-schemas.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import {
  commerceOrderSchema,
  commercePageSchema,
  reviewProofSchema,
} from "../dto/whatsapp-commerce.dto.js";
import { inboxQuerySchema } from "../dto/whatsapp-inbox.dto.js";
import { parseWhatsappRequest as parse, whatsappIdSchema } from "../dto/whatsapp.dto.js";
import { WhatsappExceptionFilter } from "../filters/whatsapp-exception.filter.js";
import { WhatsappCommerceService } from "../services/whatsapp-commerce.service.js";

@ApiTags("Pedidos de conversaciones WhatsApp")
@Controller("businesses/:businessId/whatsapp/conversations/:threadId")
@UseFilters(WhatsappExceptionFilter)
export class WhatsappCommerceController {
  constructor(private readonly commerce: WhatsappCommerceService) {}

  @Get("orders")
  @Header("Cache-Control", "private, no-store")
  @ApiRoute({
    summary: "Leer pedidos persistentes del hilo",
    params: ["businessId", "threadId"],
    query: inboxQuerySchema,
    response: envelope(commercePageSchema),
    description:
      "Cualquier membresía activa. 20 pedidos por página, incluidos borradores. Separados de pedidos/clientes/dashboard mock. Subtotal sin tarifa de delivery; no reserva stock.",
  })
  async orders(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("threadId") threadId: string,
    @Query() query: unknown,
  ) {
    return {
      data: await this.commerce.orders(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, threadId),
        parse(inboxQuerySchema, query).cursor,
      ),
    };
  }

  @Get("media/:messageId")
  @ApiRoute({
    summary: "Descargar adjunto privado recibido en el hilo",
    params: ["businessId", "threadId", "messageId"],
    responseSchema: { type: "string", format: "binary" },
    mediaType: "application/octet-stream",
    description:
      "Cualquier membresía activa del negocio activo. Imágenes normalizadas WebP o PDF, máximo 5 MiB. Descarga attachment; sin URLs públicas ni análisis antivirus/OCR. 404 si no está listo.",
    errors: { 404: "WHATSAPP_RESOURCE_NOT_FOUND." },
  })
  async media(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("threadId") threadId: string,
    @Param("messageId") messageId: string,
    @Res() response: Response,
  ) {
    const media = await this.commerce.media(
      getAuthenticatedActor(request),
      parse(whatsappIdSchema, businessId),
      parse(whatsappIdSchema, threadId),
      parse(whatsappIdSchema, messageId),
    );
    response.set({
      "Cache-Control": "private, no-store",
      "Content-Type": media.mime,
      "Content-Disposition": `attachment; filename="attachment.${media.mime === "application/pdf" ? "pdf" : "webp"}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    response.send(Buffer.from(media.bytes));
  }

  @Post("orders/:orderId/proofs/:proofId/review")
  @HttpCode(200)
  @Header("Cache-Control", "private, no-store")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiRoute({
    summary: "Validar o rechazar manualmente un comprobante (OWNER/ADMIN)",
    params: ["businessId", "threadId", "orderId", "proofId"],
    csrf: true,
    body: reviewProofSchema,
    response: envelope(commerceOrderSchema),
    description:
      "Revisión humana tras comprobar pago fuera de la aplicación. Exige revision del comprobante y orderVersion vigentes. No cobra, concilia con banco, confirma pedido ni despacha. VALIDATED exige archivo descargado. Sin reintento automático; ante resultado incierto consultar pedidos.",
    errors: {
      404: "WHATSAPP_RESOURCE_NOT_FOUND.",
      409: "WHATSAPP_ORDER_CONFLICT: actualizar antes de revisar.",
    },
  })
  async review(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("threadId") threadId: string,
    @Param("orderId") orderId: string,
    @Param("proofId") proofId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.commerce.review(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, threadId),
        parse(whatsappIdSchema, orderId),
        parse(whatsappIdSchema, proofId),
        parse(reviewProofSchema, body),
      ),
    };
  }
}
