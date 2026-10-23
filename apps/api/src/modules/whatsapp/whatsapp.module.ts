import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../config/environment.js";
import { DatabaseModule } from "../../infrastructure/database/database.module.js";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { WhatsappAuthorizationService } from "./application/whatsapp-authorization.service.js";
import { PrismaWhatsappAuthorizationStore } from "./infrastructure/prisma-whatsapp-authorization-store.js";
import { MetaWhatsappAuthorizationProvider } from "./infrastructure/meta-whatsapp-authorization-provider.js";
import { WhatsappAuthorizationController } from "./presentation/whatsapp-authorization.controller.js";
import { WhatsappOauthCallbackController } from "./presentation/whatsapp-oauth-callback.controller.js";
import { WhatsappService } from "./application/whatsapp.service.js";
import { WhatsappSignupService } from "./application/whatsapp-signup.service.js";
import { MetaWhatsappSignupGateway } from "./infrastructure/meta-whatsapp-signup-gateway.js";
import { SignedWhatsappSignupState } from "./infrastructure/whatsapp-signup-state.js";
import { PrismaWhatsappRepository } from "./infrastructure/prisma-whatsapp-repository.js";
import { MetaWhatsappGateway } from "./infrastructure/meta-whatsapp-gateway.js";
import { AesWhatsappTokenVault } from "./infrastructure/whatsapp-token-vault.js";
import { Sha256WhatsappMessageHasher } from "./infrastructure/whatsapp-message-hasher.js";
import { WhatsappController } from "./presentation/whatsapp.controller.js";
import { WhatsappWebhookSecurity } from "./infrastructure/whatsapp-webhook-security.js";
import { WhatsappSignatureGuard } from "./presentation/whatsapp-signature.guard.js";
import { WhatsappWebhookController } from "./presentation/whatsapp-webhook.controller.js";
import { WhatsappInboxService } from "./application/whatsapp-inbox.service.js";
import { PrismaWhatsappInboxRepository } from "./infrastructure/prisma-whatsapp-inbox-repository.js";
import { WhatsappInboxController } from "./presentation/whatsapp-inbox.controller.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    WhatsappWebhookController,
    WhatsappInboxController,
    WhatsappController,
    WhatsappAuthorizationController,
    WhatsappOauthCallbackController,
  ],
  providers: [
    WhatsappWebhookSecurity,
    WhatsappSignatureGuard,
    {
      provide: WhatsappInboxService,
      inject: [PrismaService, WhatsappService],
      useFactory: (prisma: PrismaService, sender: WhatsappService) =>
        new WhatsappInboxService(new PrismaWhatsappInboxRepository(prisma.client), sender),
    },
    {
      provide: WhatsappAuthorizationService,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService<Environment, true>) =>
        new WhatsappAuthorizationService(
          new PrismaWhatsappRepository(prisma.client),
          new PrismaWhatsappAuthorizationStore(prisma.client),
          new MetaWhatsappAuthorizationProvider(config),
          new MetaWhatsappGateway(config),
          new MetaWhatsappSignupGateway(config),
          new AesWhatsappTokenVault(config),
        ),
    },
    {
      provide: WhatsappSignupService,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService<Environment, true>) =>
        new WhatsappSignupService(
          new PrismaWhatsappRepository(prisma.client),
          new MetaWhatsappGateway(config),
          new MetaWhatsappSignupGateway(config),
          new SignedWhatsappSignupState(config),
          new AesWhatsappTokenVault(config),
        ),
    },
    {
      provide: WhatsappService,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService<Environment, true>) =>
        new WhatsappService(
          new PrismaWhatsappRepository(prisma.client),
          new MetaWhatsappGateway(config),
          new AesWhatsappTokenVault(config),
          new Sha256WhatsappMessageHasher(),
        ),
    },
  ],
})
export class WhatsappModule {}
