import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { PrismaService } from "../../database/prisma.service.js";
import { AgentsService } from "./services/agents.service.js";
import { PrismaAgentsRepository } from "./repositories/prisma-agents-repository.js";
import { AgentsController } from "./controllers/agents.controller.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AgentsController],
  providers: [
    {
      provide: PrismaAgentsRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaAgentsRepository(prisma.client),
    },
    {
      provide: AgentsService,
      inject: [PrismaAgentsRepository],
      useFactory: (repository: PrismaAgentsRepository) => new AgentsService(repository),
    },
  ],
})
export class AgentsModule {}
