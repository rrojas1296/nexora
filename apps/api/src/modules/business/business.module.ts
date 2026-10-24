import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { PrismaService } from "../../database/prisma.service.js";
import { BusinessService } from "./services/business.service.js";
import { PrismaBusinessRepository } from "./repositories/prisma-business-repository.js";
import { BusinessController } from "./controllers/business.controller.js";

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessController],
  providers: [
    {
      provide: PrismaBusinessRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaBusinessRepository(prisma.client),
    },
    {
      provide: BusinessService,
      inject: [PrismaBusinessRepository],
      useFactory: (repository: PrismaBusinessRepository) => new BusinessService(repository),
    },
  ],
})
export class BusinessModule {}
