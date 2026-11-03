import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaClientsRepository } from "./repositories/prisma-clients-repository.js";
import { CLIENTS_REPOSITORY } from "./repositories/clients.repository.js";
import { ClientsService } from "./services/clients.service.js";
import { ClientsController } from "./controllers/clients.controller.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ClientsController],
  providers: [{ provide: CLIENTS_REPOSITORY, useClass: PrismaClientsRepository }, ClientsService],
})
export class ClientsModule {}
