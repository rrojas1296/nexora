import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module.js";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { BusinessService } from "./application/business.service.js";
import { PrismaBusinessRepository } from "./infrastructure/prisma-business-repository.js";
import { BusinessController } from "./presentation/business.controller.js";

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
