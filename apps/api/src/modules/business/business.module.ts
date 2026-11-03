import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaBusinessRepository } from "./repositories/prisma-business-repository.js";
import { BUSINESS_REPOSITORY } from "./repositories/business.repository.js";
import { BusinessService } from "./services/business.service.js";
import { BusinessController } from "./controllers/business.controller.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BusinessController],
  providers: [
    { provide: BUSINESS_REPOSITORY, useClass: PrismaBusinessRepository },
    BusinessService,
  ],
})
export class BusinessModule {}
