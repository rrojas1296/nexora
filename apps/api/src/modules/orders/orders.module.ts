import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaOrdersRepository } from "./repositories/prisma-orders-repository.js";
import { ORDERS_REPOSITORY } from "./repositories/orders.repository.js";
import { OrdersService } from "./services/orders.service.js";
import { OrdersController } from "./controllers/orders.controller.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [OrdersController],
  providers: [{ provide: ORDERS_REPOSITORY, useClass: PrismaOrdersRepository }, OrdersService],
})
export class OrdersModule {}
