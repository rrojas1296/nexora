import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaProductsRepository } from "./repositories/prisma-products-repository.js";
import { PRODUCTS_REPOSITORY } from "./repositories/products.repository.js";
import { ProductsService } from "./services/products.service.js";
import { ProductsController } from "./controllers/products.controller.js";
import { PRODUCT_IMAGE_NORMALIZER } from "./contracts/product-image-normalizer.js";
import { SharpProductImageNormalizer } from "./providers/normalize-product-image.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ProductsController],
  providers: [
    { provide: PRODUCTS_REPOSITORY, useClass: PrismaProductsRepository },
    ProductsService,
    { provide: PRODUCT_IMAGE_NORMALIZER, useClass: SharpProductImageNormalizer },
  ],
})
export class ProductsModule {}
