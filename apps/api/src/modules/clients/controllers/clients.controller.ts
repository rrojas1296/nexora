import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import {
  commerceId,
  commerceQuery,
  CommerceExceptionFilter,
  parseCommerce as parse,
} from "../../../common/commerce/commerce-http.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import { clientCreate, clientUpdate, clientResponse, clientsResponse } from "../dto/clients.dto.js";
import { ClientsService } from "../services/clients.service.js";
@ApiTags("Clientes")
@Controller("businesses/:businessId/clients")
@UseFilters(CommerceExceptionFilter)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}
  @Get()
  @ApiRoute({
    summary: "Listar clientes persistentes y KPIs globales",
    params: ["businessId"],
    query: commerceQuery,
    response: clientsResponse,
  })
  list(@Req() req: AuthRequest, @Param("businessId") businessId: string, @Query() query: unknown) {
    return this.clients.list(
      getAuthenticatedActor(req),
      parse(commerceId, businessId),
      parse(commerceQuery, query),
    );
  }
  @Get(":clientId")
  @ApiRoute({
    summary: "Consultar cliente del negocio activo",
    params: ["businessId", "clientId"],
    response: clientResponse,
  })
  async get(
    @Req() req: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("clientId") id: string,
  ) {
    return {
      data: await this.clients.get(
        getAuthenticatedActor(req),
        parse(commerceId, businessId),
        parse(commerceId, id),
      ),
    };
  }
  @Post()
  @ApiRoute({
    summary: "Crear cliente (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: clientCreate,
    response: clientResponse,
    status: 201,
    description:
      "UUID de creación estable: el mismo UUID/cuerpo devuelve el cliente sin recrearlo; cambios o email reservado producen 409. Email/país opcionales; teléfono internacional normalizado. Sin consentimiento comercial implícito.",
    errors: { 409: "COMMERCE_CONFLICT" },
  })
  async create(
    @Req() req: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.clients.create(
        getAuthenticatedActor(req),
        parse(commerceId, businessId),
        parse(clientCreate, body),
      ),
    };
  }
  @Patch(":clientId")
  @ApiRoute({
    summary: "Editar cliente con versión (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId", "clientId"],
    body: clientUpdate,
    response: clientResponse,
    errors: { 409: "COMMERCE_CONFLICT: versión obsoleta o email reservado" },
  })
  async update(
    @Req() req: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("clientId") id: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.clients.update(
        getAuthenticatedActor(req),
        parse(commerceId, businessId),
        parse(commerceId, id),
        parse(clientUpdate, body),
      ),
    };
  }
}
