import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module.js";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { AgentsService } from "./application/agents.service.js";
import { PrismaAgentsRepository } from "./infrastructure/prisma-agents-repository.js";
import { AgentsController } from "./presentation/agents.controller.js";

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
