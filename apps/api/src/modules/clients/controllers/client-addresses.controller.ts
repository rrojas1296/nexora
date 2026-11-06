import { Body, Controller, Get, Param, Patch, Post, Req, UseFilters } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import {
  commerceId,
  CommerceExceptionFilter,
  parseCommerce as parse,
} from "../../../common/commerce/commerce-http.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import {
  addressCreate,
  addressUpdate,
  addressRemove,
  addressResponse,
  addressesResponse,
} from "../dto/client-addresses.dto.js";
import { ClientAddressesService } from "../services/client-addresses.service.js";
const params = ["businessId", "clientId", "addressId"];
@ApiTags("Direcciones de clientes")
@Controller("businesses/:businessId/clients/:clientId/addresses")
@UseFilters(CommerceExceptionFilter)
export class ClientAddressesController {
  constructor(private readonly addresses: ClientAddressesService) {}
  @Get()
  @ApiRoute({
    summary: "Listar hasta diez direcciones del cliente activo",
    params: params.slice(0, 2),
    response: addressesResponse,
  })
  async list(
    @Req() req: AuthRequest,
    @Param("businessId") business: string,
    @Param("clientId") client: string,
  ) {
    return {
      data: await this.addresses.list(
        getAuthenticatedActor(req),
        parse(commerceId, business),
        parse(commerceId, client),
      ),
    };
  }
  @Post()
  @ApiRoute({
    summary: "Guardar dirección (OWNER/ADMIN)",
    csrf: true,
    params: params.slice(0, 2),
    body: addressCreate,
    response: addressResponse,
    status: 201,
    errors: { 409: "COMMERCE_CONFLICT" },
    description:
      "UUID estable de creación. No modifica pedidos históricos ni el domicilio legacy. Sin consentimiento de marketing implícito.",
  })
  async create(
    @Req() req: AuthRequest,
    @Param("businessId") business: string,
    @Param("clientId") client: string,
    @Body() body: unknown,
  ) {
    const { id, ...input } = parse(addressCreate, body);
    return {
      data: await this.addresses.save(
        getAuthenticatedActor(req),
        parse(commerceId, business),
        parse(commerceId, client),
        id,
        input,
      ),
    };
  }
  @Patch(":addressId")
  @ApiRoute({
    summary: "Editar dirección con versión (OWNER/ADMIN)",
    csrf: true,
    params,
    body: addressUpdate,
    response: addressResponse,
    errors: { 409: "COMMERCE_CONFLICT" },
  })
  async update(
    @Req() req: AuthRequest,
    @Param("businessId") business: string,
    @Param("clientId") client: string,
    @Param("addressId") id: string,
    @Body() body: unknown,
  ) {
    const { version, ...input } = parse(addressUpdate, body);
    return {
      data: await this.addresses.save(
        getAuthenticatedActor(req),
        parse(commerceId, business),
        parse(commerceId, client),
        parse(commerceId, id),
        input,
        version,
      ),
    };
  }
  @Post(":addressId/remove")
  @ApiRoute({
    summary: "Eliminar lógicamente dirección con versión (OWNER/ADMIN)",
    csrf: true,
    params,
    body: addressRemove,
    response: z.object({ removed: z.boolean() }),
    status: 201,
    errors: { 409: "COMMERCE_CONFLICT" },
  })
  async remove(
    @Req() req: AuthRequest,
    @Param("businessId") business: string,
    @Param("clientId") client: string,
    @Param("addressId") id: string,
    @Body() body: unknown,
  ) {
    await this.addresses.remove(
      getAuthenticatedActor(req),
      parse(commerceId, business),
      parse(commerceId, client),
      parse(commerceId, id),
      parse(addressRemove, body).version,
    );
    return { removed: true };
  }
}
