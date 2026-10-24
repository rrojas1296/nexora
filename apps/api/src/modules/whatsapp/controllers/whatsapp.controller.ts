import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseFilters,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { envelope } from "../../../common/documentation/response-schemas.js";
import { attemptResponse, connectionResponse } from "../dto/whatsapp-responses.dto.js";
import { Throttle } from "@nestjs/throttler";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import { WhatsappService } from "../services/whatsapp.service.js";
import { WhatsappSignupService } from "../services/whatsapp-signup.service.js";
import { WhatsappExceptionFilter } from "../filters/whatsapp-exception.filter.js";
import {
  parseWhatsappRequest as parse,
  whatsappConnectionSchema,
  whatsappIdSchema,
  whatsappMessageSchema,
  whatsappSignupConfigurationSchema,
  whatsappSignupSchema,
} from "../dto/whatsapp.dto.js";

@ApiTags("WhatsApp")
@Controller("businesses/:businessId/whatsapp")
@UseFilters(WhatsappExceptionFilter)
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly signup: WhatsappSignupService,
  ) {}

  @Get("signup/configuration")
  @ApiRoute({
    summary: "Preparar Embedded Signup de Meta (OWNER/ADMIN)",
    params: ["businessId"],
    response: envelope(whatsappSignupConfigurationSchema),
    description:
      "Configuración pública y contexto firmado de 15 minutos ligado al usuario, sesión y negocio activos. Sin access tokens ni App Secret.",
    errors: { 503: "WHATSAPP_NOT_CONFIGURED." },
  })
  async signupConfiguration(@Req() request: AuthRequest, @Param("businessId") businessId: string) {
    return {
      data: await this.signup.configuration(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
      ),
    };
  }

  @Post("signup/complete")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiRoute({
    summary: "Completar Embedded Signup Cloud API (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: whatsappSignupSchema,
    response: envelope(connectionResponse),
    description:
      "Solo FINISH del flujo Cloud API estándar. Canjea code de un uso, verifica app/permisos/WABA/número en Meta, suscribe webhooks y registra el número con el PIN de seis dígitos elegido por el usuario. No conserva PIN/código ni los registra. Guarda token cifrado solo tras completar. Sin retries ni sustitución de una conexión activa. No es una transacción distribuida: ante timeout/error comprobar Meta y conexión antes de reintentar. No implementa coexistencia, migraciones ni alta sin número.",
    errors: {
      409: "WHATSAPP_CONNECTION_CONFLICT.",
      422: "WHATSAPP_INVALID_CREDENTIALS o WHATSAPP_SIGNUP_INCOMPLETE.",
      400: "WHATSAPP_SIGNUP_EXPIRED o petición inválida.",
      502: "WHATSAPP_PROVIDER_UNAVAILABLE.",
      503: "WHATSAPP_NOT_CONFIGURED.",
    },
  })
  async completeSignup(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.signup.complete(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappSignupSchema, body),
      ),
    };
  }

  @Get("connection")
  @ApiRoute({
    summary: "Consultar conexión WhatsApp (OWNER/ADMIN)",
    params: ["businessId"],
    response: envelope(connectionResponse.nullable()),
    description:
      "Devuelve metadatos o null, nunca credenciales. No consulta vigencia del token en Meta.",
  })
  async connection(@Req() request: AuthRequest, @Param("businessId") businessId: string) {
    return {
      data: await this.whatsapp.getConnection(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
      ),
    };
  }

  @Put("connection")
  @ApiRoute({
    summary: "Conectar número de Meta al negocio (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: whatsappConnectionSchema,
    response: envelope(connectionResponse),
    description:
      "Comprueba acceso al Phone Number ID en Graph API antes de guardar el token cifrado. No registra el número ni suscribe la app a la WABA. accessToken es de Meta, no la sesión de Nexora.",
    errors: {
      409: "WHATSAPP_CONNECTION_CONFLICT: número reservado.",
      422: "WHATSAPP_INVALID_CREDENTIALS.",
      502: "WHATSAPP_PROVIDER_UNAVAILABLE.",
      503: "WHATSAPP_NOT_CONFIGURED.",
    },
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async connect(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.whatsapp.connect(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappConnectionSchema, body),
      ),
    };
  }

  @Delete("connection")
  @ApiRoute({
    summary: "Desconectar WhatsApp localmente (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    status: 204,
    description:
      "Elimina token cifrado y marca borrado lógico. No revoca el token en Meta ni cancela envíos en curso.",
  })
  @HttpCode(204)
  async disconnect(@Req() request: AuthRequest, @Param("businessId") businessId: string) {
    await this.whatsapp.disconnect(
      getAuthenticatedActor(request),
      parse(whatsappIdSchema, businessId),
    );
  }

  @Post("messages")
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    schema: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
    description:
      "UUID nuevo por mensaje intencional; conservar clave y body si se pierde la respuesta. No cambiar clave para forzar reenvío incierto.",
  })
  @ApiRoute({
    summary: "Enviar texto o plantilla (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: whatsappMessageSchema,
    response: attemptResponse,
    description:
      "to: 8–15 dígitos internacionales sin +. Texto libre sujeto a ventana de 24h de Meta; plantillas aprobadas con parámetros de texto en body. Guarda intento antes de enviar, sin retries. ACCEPTED no es entrega; UNKNOWN/PENDING no deben reenviarse a ciegas. Meta puede rechazar el envío aunque HTTP sea 200: inspeccionar data.status. No hay seguimiento de entrega por webhook todavía.",
    errors: {
      409: "WHATSAPP_NOT_CONNECTED o WHATSAPP_IDEMPOTENCY_CONFLICT.",
      503: "WHATSAPP_NOT_CONFIGURED.",
    },
  })
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async send(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Headers("idempotency-key") key: unknown,
    @Body() body: unknown,
  ) {
    return {
      data: await this.whatsapp.send(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, key),
        parse(whatsappMessageSchema, body),
      ),
    };
  }

  @Get("messages/:attemptId")
  @ApiRoute({
    summary: "Consultar intento de envío (OWNER/ADMIN)",
    params: ["businessId", "attemptId"],
    response: attemptResponse,
    description:
      "Consulta local sin reenviar ni consultar a Meta. No devuelve estados posteriores de entrega/lectura.",
    errors: { 404: "WHATSAPP_ATTEMPT_NOT_FOUND." },
  })
  async status(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("attemptId") attemptId: string,
  ) {
    return {
      data: await this.whatsapp.getAttempt(
        getAuthenticatedActor(request),
        parse(whatsappIdSchema, businessId),
        parse(whatsappIdSchema, attemptId),
      ),
    };
  }
}
