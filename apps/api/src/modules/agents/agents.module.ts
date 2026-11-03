import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaAgentsRepository } from "./repositories/prisma-agents-repository.js";
import { AGENTS_REPOSITORY } from "./repositories/agents.repository.js";
import { AgentsService } from "./services/agents.service.js";
import { AgentsController } from "./controllers/agents.controller.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AgentsController],
  providers: [{ provide: AGENTS_REPOSITORY, useClass: PrismaAgentsRepository }, AgentsService],
})
export class AgentsModule {}
