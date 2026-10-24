import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { PrismaService } from "../../database/prisma.service.js";
import { ProductsService } from "./services/products.service.js";
import { PrismaProductsRepository } from "./repositories/prisma-products-repository.js";
import { ProductsController } from "./controllers/products.controller.js";
import { normalizeProductImage } from "./providers/normalize-product-image.js";

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [
    {
      provide: PrismaProductsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaProductsRepository(prisma.client),
    },
    {
      provide: ProductsService,
      inject: [PrismaProductsRepository],
      useFactory: (repository: PrismaProductsRepository) =>
        new ProductsService(repository, normalizeProductImage),
    },
  ],
})
export class ProductsModule {}
