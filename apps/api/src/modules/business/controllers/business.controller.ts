import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { businessResponse } from "../dto/business-responses.dto.js";
import type { AuthRequest } from "../../auth/http/auth.request.js";
import { BusinessService } from "../services/business.service.js";
import {
  businessIdSchema,
  createBusinessSchema,
  updateBusinessSchema,
} from "../dto/business.dto.js";

function actor(request: AuthRequest) {
  if (!request.auth) throw new UnauthorizedException();
  return { userId: request.auth.claims.sub, activeBusinessId: request.auth.claims.businessId };
}

@ApiTags("Negocios")
@Controller("businesses")
export class BusinessController {
  constructor(private readonly business: BusinessService) {}

  @Post()
  @ApiRoute({
    summary: "Crear negocio, membresía OWNER y agente deshabilitado",
    csrf: true,
    body: createBusinessSchema,
    response: businessResponse,
    status: 201,
    description:
      "Admite cuentas sin negocio. ID estable del cliente para recuperar una creación incierta; no cambia la sesión activa. No publica el contexto ni conecta WhatsApp.",
  })
  async create(@Req() request: AuthRequest, @Body() body: unknown) {
    const input = createBusinessSchema.safeParse(body);
    if (!input.success) throw new BadRequestException();
    const result = await this.business.create(actor(request), input.data);
    if (!result) throw new ForbiddenException();
    return { data: result };
  }

  @Get(":businessId")
  @ApiRoute({
    summary: "Consultar configuración del negocio activo",
    params: ["businessId"],
    response: businessResponse,
  })
  async get(@Req() request: AuthRequest, @Param("businessId") id: string) {
    const parsed = businessIdSchema.safeParse(id);
    if (!parsed.success) throw new BadRequestException();
    const result = await this.business.get(actor(request), parsed.data);
    if (!result) throw new ForbiddenException();
    return { data: result };
  }

  @Patch(":businessId")
  @ApiRoute({
    summary: "Guardar configuración o publicar contexto (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: updateBusinessSchema,
    response: businessResponse,
    description:
      "Contexto hasta 30000 caracteres; revision obligatoria al editar/publicar contexto. Revisión obsoleta o permisos insuficientes: 403. Publicar no habilita IA ni concede herramientas.",
  })
  async update(
    @Req() request: AuthRequest,
    @Param("businessId") id: string,
    @Body() body: unknown,
  ) {
    const businessId = businessIdSchema.safeParse(id);
    const input = updateBusinessSchema.safeParse(body);
    if (!businessId.success || !input.success) throw new BadRequestException();
    const result = await this.business.update(actor(request), businessId.data, input.data);
    if (!result) throw new ForbiddenException();
    return { data: result };
  }
}
