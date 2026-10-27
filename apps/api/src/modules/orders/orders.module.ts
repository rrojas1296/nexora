import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { PrismaService } from "../../database/prisma.service.js";
import { OrdersController } from "./controllers/orders.controller.js";
import { OrdersRepository } from "./repositories/orders.repository.js";
import { PrismaOrdersRepository } from "./repositories/prisma-orders-repository.js";
import { OrdersService } from "./services/orders.service.js";
@Module({
  imports: [DatabaseModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrdersRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaOrdersRepository(prisma.client),
    },
    {
      provide: OrdersService,
      inject: [OrdersRepository],
      useFactory: (repository: OrdersRepository) => new OrdersService(repository),
    },
  ],
})
export class OrdersModule {}
