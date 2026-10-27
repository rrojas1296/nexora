import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import {
  commerceId,
  CommerceExceptionFilter,
  parseCommerce as parse,
} from "../../../common/commerce/commerce-http.js";
import { getAuthenticatedActor, type AuthRequest } from "../../auth/http/auth.request.js";
import {
  orderCreate,
  orderUpdate,
  ordersQuery,
  orderResponse,
  ordersResponse,
} from "../dto/orders.dto.js";
import { OrdersService } from "../services/orders.service.js";
@ApiTags("Pedidos")
@Controller("businesses/:businessId/orders")
@UseFilters(CommerceExceptionFilter)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get()
  @ApiRoute({
    summary: "Listar pedidos persistentes y KPIs globales",
    params: ["businessId"],
    query: ordersQuery,
    response: ordersResponse,
  })
  list(@Req() req: AuthRequest, @Param("businessId") businessId: string, @Query() query: unknown) {
    return this.orders.list(
      getAuthenticatedActor(req),
      parse(commerceId, businessId),
      parse(ordersQuery, query),
    );
  }
  @Get(":orderId")
  @ApiRoute({
    summary: "Consultar pedido y snapshots de productos",
    params: ["businessId", "orderId"],
    response: orderResponse,
  })
  async get(
    @Req() req: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("orderId") id: string,
  ) {
    return {
      data: await this.orders.get(
        getAuthenticatedActor(req),
        parse(commerceId, businessId),
        parse(commerceId, id),
      ),
    };
  }
  @Post()
  @ApiRoute({
    summary: "Crear borrador de pedido (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: orderCreate,
    response: orderResponse,
    status: 201,
    description:
      "UUID estable para creación idempotente; solo cliente activo autorizado. Precios/nombres/moneda desde catálogo servidor, sin confiar importes del cliente. Hasta 10 líneas, stock comprobado pero no reservado/descontado. Sin pago, envío o confirmación implícitos.",
    errors: { 409: "COMMERCE_CONFLICT, COMMERCE_INVALID_CLIENT, COMMERCE_INVALID_PRODUCTS" },
  })
  async create(
    @Req() req: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.orders.create(
        getAuthenticatedActor(req),
        parse(commerceId, businessId),
        parse(orderCreate, body),
      ),
    };
  }
  @Patch(":orderId")
  @ApiRoute({
    summary: "Editar borrador o transicionar pedido con versión (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId", "orderId"],
    body: orderUpdate,
    response: orderResponse,
    description:
      "Items/cliente solo editables en DRAFT manual. DRAFT manual→PENDING, DRAFT/PENDING→CANCELLED, PENDING→PAID solo con paymentStatus VALIDATED por revisión humana, PAID→SHIPPED. Borradores WhatsApp exigen confirmación del cliente por el flujo IA; no se pueden confirmar/editarlos desde aquí. Cambios invalidan tokens. No llama proveedores, acredita pagos, cobra envío ni descuenta stock.",
    errors: {
      409: "COMMERCE_CONFLICT, COMMERCE_INVALID_TRANSITION, COMMERCE_INVALID_CLIENT, COMMERCE_INVALID_PRODUCTS",
    },
  })
  async update(
    @Req() req: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("orderId") id: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.orders.update(
        getAuthenticatedActor(req),
        parse(commerceId, businessId),
        parse(commerceId, id),
        parse(orderUpdate, body),
      ),
    };
  }
}
