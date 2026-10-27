import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { PrismaService } from "../../database/prisma.service.js";
import { ClientsController } from "./controllers/clients.controller.js";
import { ClientsRepository } from "./repositories/clients.repository.js";
import { PrismaClientsRepository } from "./repositories/prisma-clients-repository.js";
import { ClientsService } from "./services/clients.service.js";
@Module({
  imports: [DatabaseModule],
  controllers: [ClientsController],
  providers: [
    {
      provide: ClientsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaClientsRepository(prisma.client),
    },
    {
      provide: ClientsService,
      inject: [ClientsRepository],
      useFactory: (repository: ClientsRepository) => new ClientsService(repository),
    },
  ],
})
export class ClientsModule {}
