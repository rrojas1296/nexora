import { Body, Controller, Get, HttpCode, Param, Post, Req, UseFilters } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { envelope } from "../../../common/documentation/response-schemas.js";
import { connectionResponse } from "../dto/whatsapp-responses.dto.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import { WhatsappAuthorizationService } from "../services/whatsapp-authorization.service.js";
import { WhatsappExceptionFilter } from "../filters/whatsapp-exception.filter.js";
import { parseWhatsappRequest as parse, whatsappIdSchema } from "../dto/whatsapp.dto.js";
import {
  authorizationCompleteSchema,
  authorizationStartSchema,
  authorizationStatusSchema,
  authorizationUrlSchema,
} from "../dto/whatsapp-authorization.dto.js";

@ApiTags("WhatsApp")
@Controller("businesses/:businessId/whatsapp/authorization")
@UseFilters(WhatsappExceptionFilter)
export class WhatsappAuthorizationController {
  constructor(private readonly authorization: WhatsappAuthorizationService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiRoute({
    summary: "Iniciar Facebook Login por redirección para números existentes (OWNER/ADMIN)",
    params: ["businessId"],
    csrf: true,
    body: authorizationStartSchema,
    response: envelope(authorizationUrlSchema),
    description:
      "Crea intento persistente de 15 minutos y state aleatorio de un uso ligado a sesión/usuario/negocio. Devuelve URL oficial para navegación de página completa, no un popup. No es Embedded Signup ni registra números nuevos.",
    errors: { 409: "Conexión activa existente.", 503: "OAuth no configurado." },
  })
  async start(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.authorization.start(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(authorizationStartSchema, body).locale,
      ),
    };
  }

  @Get(":attemptId")
  @ApiRoute({
    summary: "Consultar intento OAuth y números Cloud API autorizados",
    params: ["businessId", "attemptId"],
    response: envelope(authorizationStatusSchema),
    description:
      "Solo la misma sesión/usuario/negocio OWNER/ADMIN. Nunca devuelve código ni token. READY requiere selección explícita. Sin reintentos automáticos a Meta.",
  })
  async status(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("attemptId") id: string,
  ) {
    return {
      data: await this.authorization.status(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, id),
      ),
    };
  }

  @Post("complete")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiRoute({
    summary: "Conectar un número existente autorizado por Facebook (OWNER/ADMIN)",
    params: ["businessId"],
    csrf: true,
    body: authorizationCompleteSchema,
    response: envelope(connectionResponse),
    description:
      "Consume intento READY una sola vez, vuelve a verificar app/permisos/WABA/número en Meta, suscribe la app y guarda token cifrado. No registra ni migra números. Sin retries; un fallo puede dejar efectos en Meta. Consultar conexión antes de iniciar otro intento.",
    errors: {
      400: "Intento expirado o consumido.",
      409: "Número reservado o conexión activa.",
      422: "Activos/permisos no válidos.",
      502: "Proveedor no disponible.",
    },
  })
  async complete(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.authorization.complete(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(authorizationCompleteSchema, body),
      ),
    };
  }
}
