import {
  Controller,
  Body,
  Post,
  Headers,
  HttpCode,
  Get,
  Header,
  Param,
  Query,
  Req,
  UseFilters,
} from "@nestjs/common";
import { ApiTags, ApiHeader } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { envelope } from "../../../common/documentation/response-schemas.js";
import { attemptResponse } from "../dto/whatsapp-responses.dto.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import { WhatsappInboxService } from "../services/whatsapp-inbox.service.js";
import { WhatsappExceptionFilter } from "../filters/whatsapp-exception.filter.js";
import {
  inboxQuerySchema,
  inboxSendTextSchema,
  messagePageSchema,
  threadPageSchema,
} from "../dto/whatsapp-inbox.dto.js";
import { parseWhatsappRequest as parse, whatsappIdSchema } from "../dto/whatsapp.dto.js";

@ApiTags("Conversaciones WhatsApp")
@Controller("businesses/:businessId/whatsapp/conversations")
@UseFilters(WhatsappExceptionFilter)
export class WhatsappInboxController {
  constructor(private readonly inbox: WhatsappInboxService) {}

  @Get()
  @Header("Cache-Control", "private, no-store")
  @ApiRoute({
    summary: "Listar conversaciones del negocio activo",
    params: ["businessId"],
    query: inboxQuerySchema,
    response: envelope(threadPageSchema),
    description:
      "Membresía activa de cualquier rol. Hasta 20 conversaciones por página, ordenadas por último mensaje descendente. Cursor UUID opcional; sin búsqueda ni KPIs de fixtures.",
  })
  async threads(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Query() query: unknown,
  ) {
    return {
      data: await this.inbox.threads(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(inboxQuerySchema, query).cursor,
      ),
    };
  }

  @Post(":threadId/messages")
  @HttpCode(200)
  @Header("Cache-Control", "private, no-store")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    schema: { type: "string", format: "uuid" },
    description:
      "Una clave por envío intencional. Ante respuesta incierta consultar el intento por esta clave, sin reenviar.",
  })
  @ApiRoute({
    summary: "Responder con texto a una conversación (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId", "threadId"],
    body: inboxSendTextSchema,
    response: attemptResponse,
    description:
      "Texto de 1–4096 caracteres; destinatario obtenido del hilo autorizado, no del cliente. Requiere conexión activa del mismo número y último entrante de menos de 24h. Reserva intento y saliente en la misma transacción antes de llamar a Meta, sin retries. ACCEPTED indica aceptación de Meta, no entrega. Repetir la misma clave/body devuelve el intento sin enviar de nuevo. Sin plantillas ni adjuntos en este endpoint.",
    errors: {
      404: "WHATSAPP_CONVERSATION_NOT_FOUND.",
      409: "WHATSAPP_NOT_CONNECTED, WHATSAPP_REPLY_WINDOW_CLOSED o WHATSAPP_IDEMPOTENCY_CONFLICT.",
      503: "WHATSAPP_NOT_CONFIGURED.",
    },
  })
  async send(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("threadId") threadId: string,
    @Headers("idempotency-key") key: unknown,
    @Body() body: unknown,
  ) {
    return {
      data: await this.inbox.sendText(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, threadId),
        parse(whatsappIdSchema, key),
        parse(inboxSendTextSchema, body).body,
      ),
    };
  }

  @Get(":threadId/send-attempts/:key")
  @Header("Cache-Control", "private, no-store")
  @ApiRoute({
    summary: "Consultar envío del hilo por clave de idempotencia (OWNER/ADMIN)",
    params: ["businessId", "threadId", "key"],
    response: attemptResponse,
    description:
      "Solo lectura local. Permite reconciliar una respuesta perdida sin reintentar la mutación. Un 404 no prueba que una solicitud original aún en curso no vaya a reservar el intento después; no reenviar automáticamente.",
    errors: { 404: "WHATSAPP_ATTEMPT_NOT_FOUND." },
  })
  async attempt(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("threadId") threadId: string,
    @Param("key") key: string,
  ) {
    return {
      data: await this.inbox.attempt(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, threadId),
        parse(whatsappIdSchema, key),
      ),
    };
  }

  @Get(":threadId/messages")
  @Header("Cache-Control", "private, no-store")
  @ApiRoute({
    summary: "Leer mensajes recibidos y enviados de una conversación del negocio activo",
    params: ["businessId", "threadId"],
    query: inboxQuerySchema,
    response: envelope(messagePageSchema),
    description:
      "Membresía activa de cualquier rol. Hasta 50 mensajes por página, más recientes primero; cursor UUID opcional. Incluye dirección, estado local del intento saliente y disponibilidad para responder (rol, conexión del mismo número y ventana de 24h). ACCEPTED no significa entregado/leído. Sin importación histórica ni estados de entrega.",
    errors: { 404: "WHATSAPP_CONVERSATION_NOT_FOUND." },
  })
  async messages(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("threadId") threadId: string,
    @Query() query: unknown,
  ) {
    return {
      data: await this.inbox.messages(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, threadId),
        parse(inboxQuerySchema, query).cursor,
      ),
    };
  }
}
