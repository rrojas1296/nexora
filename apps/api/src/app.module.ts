import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./config/environment.js";
import { DatabaseModule } from "./infrastructure/database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { BusinessModule } from "./modules/business/business.module.js";
import { StoresModule } from "./modules/stores/stores.module.js";
import { ProductsModule } from "./modules/products/products.module.js";
import { OrdersModule } from "./modules/orders/orders.module.js";
import { ClientsModule } from "./modules/clients/clients.module.js";
import { ConversationsModule } from "./modules/conversations/conversations.module.js";
import { AgentsModule } from "./modules/agents/agents.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ".env",
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
    ClientsModule,
    ConversationsModule,
    AgentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
