import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaClientsRepository } from "./repositories/prisma-clients-repository.js";
import { CLIENTS_REPOSITORY } from "./repositories/clients.repository.js";
import { ClientsService } from "./services/clients.service.js";
import { ClientsController } from "./controllers/clients.controller.js";
import { ClientAddressesController } from "./controllers/client-addresses.controller.js";
import { ClientAddressesService } from "./services/client-addresses.service.js";
import { CLIENT_ADDRESSES_REPOSITORY } from "./repositories/client-addresses.repository.js";
import { PrismaClientAddressesRepository } from "./repositories/prisma-client-addresses-repository.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ClientsController, ClientAddressesController],
  providers: [
    { provide: CLIENTS_REPOSITORY, useClass: PrismaClientsRepository },
    ClientsService,
    { provide: CLIENT_ADDRESSES_REPOSITORY, useClass: PrismaClientAddressesRepository },
    ClientAddressesService,
  ],
})
export class ClientsModule {}
