import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module.js";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { ProductsService } from "./application/products.service.js";
import { PrismaProductsRepository } from "./infrastructure/prisma-products-repository.js";
import { ProductsController } from "./presentation/products.controller.js";

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
      useFactory: (repository: PrismaProductsRepository) => new ProductsService(repository),
    },
  ],
})
export class ProductsModule {}
