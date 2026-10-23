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
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
  UseFilters,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import {
  categoriesResponse,
  categoryResponse,
  imageResponse,
  productListResponse,
  productResponse,
} from "../../../common/documentation/response-schemas.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import {
  maxProductImageBytes,
  normalizeProductImage,
} from "../infrastructure/normalize-product-image.js";
import type { AuthRequest } from "../../auth/presentation/auth.request.js";
import type { ProductActor } from "../domain/product.js";
import { ProductsService } from "../application/products.service.js";
import { ProductsExceptionFilter } from "./products-exception.filter.js";
import {
  parseProductRequest as parse,
  productIdSchema,
  categoryInputSchema,
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

@ApiTags("Productos")
@Controller("businesses/:businessId/products")
@UseFilters(ProductsExceptionFilter)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiRoute({
    summary: "Listar productos con paginación y KPIs globales",
    params: ["businessId"],
    query: productListSchema,
    response: productListResponse,
    description:
      "Lectura con membresía activa del negocio activo. KPIs de toda la colección, independientes de filtros/página.",
  })
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

  @Get("categories")
  @ApiRoute({
    summary: "Listar categorías del negocio",
    params: ["businessId"],
    response: categoriesResponse,
  })
  async listCategories(@Req() request: AuthRequest, @Param("businessId") businessId: string) {
    return {
      data: await this.products.listCategories(actor(request), parse(productIdSchema, businessId)),
    };
  }

  @Post("categories")
  @ApiRoute({
    summary: "Crear categoría (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: categoryInputSchema,
    response: categoryResponse,
    status: 201,
    errors: { 409: "PRODUCT_CATEGORY_EXISTS: nombre reservado en este negocio." },
  })
  async createCategory(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Body() body: unknown,
  ) {
    return {
      data: await this.products.createCategory(
        actor(request),
        parse(productIdSchema, businessId),
        parse(categoryInputSchema, body).name,
      ),
    };
  }

  @Post("images")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      required: ["image"],
      additionalProperties: false,
      properties: {
        image: {
          type: "string",
          format: "binary",
          description: "JPG/PNG/WebP hasta 2 MiB y 20 megapíxeles; se normaliza a WebP.",
        },
      },
    },
  })
  @ApiRoute({
    summary: "Subir imagen de producto (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    response: imageResponse,
    status: 201,
    description:
      "Campo único image, sin otros campos. Cuota de 1000 archivos por negocio; 10 subidas/minuto/IP/proceso. Devuelve URL privada, no crea producto.",
    errors: {
      400: "PRODUCT_IMAGE_INVALID: archivo inválido.",
      409: "PRODUCT_IMAGE_LIMIT: cuota agotada.",
      413: "Archivo mayor de 2 MiB.",
    },
  })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(
    FileInterceptor("image", {
      limits: { fileSize: maxProductImageBytes, files: 1, fields: 0, parts: 2 },
    }),
  )
  async uploadImage(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    const currentActor = actor(request);
    const scope = parse(productIdSchema, businessId);
    await this.products.checkImageWriteAccess(currentActor, scope);
    const data = await normalizeProductImage(file?.buffer);
    return { data: { imageUrl: await this.products.createImage(currentActor, scope, data) } };
  }

  @Get("images/:imageId")
  @ApiRoute({
    summary: "Descargar imagen privada del negocio",
    params: ["businessId", "imageId"],
    mediaType: "image/webp",
    responseSchema: { type: "string", format: "binary" },
    errors: { 404: "Imagen no encontrada o no visible." },
  })
  async getImage(
    @Req() request: AuthRequest,
    @Param("businessId") businessId: string,
    @Param("imageId") imageId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.products.getImage(
      actor(request),
      parse(productIdSchema, businessId),
      parse(productIdSchema, imageId),
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    return new StreamableFile(Buffer.from(image.data), {
      type: "image/webp",
      length: image.data.byteLength,
      disposition: 'inline; filename="product.webp"',
    });
  }

  @Get(":id")
  @ApiRoute({
    summary: "Consultar producto",
    params: ["businessId", "id"],
    response: productResponse,
    errors: { 404: "PRODUCT_NOT_FOUND." },
  })
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
  @ApiRoute({
    summary: "Crear producto (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: productInputSchema,
    response: productResponse,
    status: 201,
    description:
      "Importes string con hasta dos decimales, moneda PEN. Categoría debe existir; imágenes internas deben pertenecer al negocio.",
    errors: {
      400: "Categoría o imagen inválida.",
      409: "PRODUCT_SKU_EXISTS: SKU reservado, incluso si el producto fue eliminado.",
    },
  })
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
  @ApiRoute({
    summary: "Actualizar producto (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId", "id"],
    body: productPatchSchema,
    response: productResponse,
    description: "Body parcial no vacío. No cambia la moneda.",
    errors: { 404: "PRODUCT_NOT_FOUND.", 409: "PRODUCT_SKU_EXISTS." },
  })
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
  @ApiRoute({
    summary: "Eliminar producto lógicamente (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId", "id"],
    status: 204,
    errors: { 404: "PRODUCT_NOT_FOUND.", 409: "PRODUCT_HAS_ORDERS: producto vinculado a pedidos." },
  })
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
