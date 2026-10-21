import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseFilters,
} from "@nestjs/common";
import type { AuthRequest } from "../../auth/presentation/auth.request.js";
import type { ProductActor } from "../domain/product.js";
import { ProductsService } from "../application/products.service.js";
import { ProductsExceptionFilter } from "./products-exception.filter.js";
import {
  parseProductRequest as parse,
  productIdSchema,
  productInputSchema,
  productListSchema,
  productPatchSchema,
} from "./products.dto.js";

function actor(request: AuthRequest): ProductActor {
  if (!request.auth) throw new UnauthorizedException();
  return {
    userId: request.auth.claims.sub,
    businessId: request.auth.claims.businessId,
    sessionId: request.auth.claims.sid,
  };
}

@Controller("businesses/:businessId/products")
@UseFilters(ProductsExceptionFilter)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Query() query: unknown,
  ) {
    return this.products.list(
      actor(request),
      parse(productIdSchema, businessId),
      parse(productListSchema, query),
    );
  }

  @Get(":id")
  async get(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
  ) {
    return {
      data: await this.products.get(
        actor(request),
        parse(productIdSchema, businessId),
        parse(productIdSchema, id),
      ),
    };
  }

  @Post()
  async create(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.products.create(
        actor(request),
        parse(productIdSchema, businessId),
        parse(productInputSchema, body),
      ),
    };
  }

  @Patch(":id")
  async update(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.products.update(
        actor(request),
        parse(productIdSchema, businessId),
        parse(productIdSchema, id),
        parse(productPatchSchema, body),
      ),
    };
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
  ) {
    await this.products.delete(
      actor(request),
      parse(productIdSchema, businessId),
      parse(productIdSchema, id),
    );
  }
}
