import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../config/environment.js";
import { DatabaseModule } from "../../database/database.module.js";
import { PrismaService } from "../../database/prisma.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { WhatsappAuthorizationService } from "./services/whatsapp-authorization.service.js";
import { PrismaWhatsappAuthorizationStore } from "./repositories/prisma-whatsapp-authorization-store.js";
import { MetaWhatsappAuthorizationProvider } from "./providers/meta-whatsapp-authorization-provider.js";
import { WhatsappAuthorizationController } from "./controllers/whatsapp-authorization.controller.js";
import { WhatsappOauthCallbackController } from "./controllers/whatsapp-oauth-callback.controller.js";
import { WhatsappService } from "./services/whatsapp.service.js";
import { WhatsappSignupService } from "./services/whatsapp-signup.service.js";
import { MetaWhatsappSignupGateway } from "./providers/meta-whatsapp-signup-gateway.js";
import { MetaWhatsappGraphClient } from "./providers/meta-whatsapp-graph-client.js";
import { SignedWhatsappSignupState } from "./providers/whatsapp-signup-state.js";
import { PrismaWhatsappRepository } from "./repositories/prisma-whatsapp-repository.js";
import { MetaWhatsappGateway } from "./providers/meta-whatsapp-gateway.js";
import { AesWhatsappTokenVault } from "./providers/whatsapp-token-vault.js";
import { Sha256WhatsappMessageHasher } from "./providers/whatsapp-message-hasher.js";
import { WhatsappController } from "./controllers/whatsapp.controller.js";
import { WhatsappWebhookSecurity } from "./providers/whatsapp-webhook-security.js";
import { WhatsappSignatureGuard } from "./guards/whatsapp-signature.guard.js";
import { WhatsappWebhookController } from "./controllers/whatsapp-webhook.controller.js";
import { WhatsappInboxService } from "./services/whatsapp-inbox.service.js";
import { PrismaWhatsappInboxRepository } from "./repositories/prisma-whatsapp-inbox-repository.js";
import { WhatsappInboxController } from "./controllers/whatsapp-inbox.controller.js";

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
    Sha256WhatsappMessageHasher,
    {
      provide: PrismaWhatsappRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaWhatsappRepository(prisma.client),
    },
    {
      provide: PrismaWhatsappInboxRepository,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaWhatsappInboxRepository(prisma.client),
    },
    {
      provide: PrismaWhatsappAuthorizationStore,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaWhatsappAuthorizationStore(prisma.client),
    },
    {
      provide: MetaWhatsappGateway,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => new MetaWhatsappGateway(config),
    },
    {
      provide: MetaWhatsappGraphClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => new MetaWhatsappGraphClient(config),
    },
    {
      provide: MetaWhatsappSignupGateway,
      inject: [MetaWhatsappGraphClient],
      useFactory: (graph: MetaWhatsappGraphClient) => new MetaWhatsappSignupGateway(graph),
    },
    {
      provide: MetaWhatsappAuthorizationProvider,
      inject: [ConfigService, MetaWhatsappGraphClient, MetaWhatsappSignupGateway],
      useFactory: (
        config: ConfigService<Environment, true>,
        graph: MetaWhatsappGraphClient,
        signup: MetaWhatsappSignupGateway,
      ) => new MetaWhatsappAuthorizationProvider(config, graph, signup),
    },
    {
      provide: SignedWhatsappSignupState,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) =>
        new SignedWhatsappSignupState(config),
    },
    {
      provide: AesWhatsappTokenVault,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => new AesWhatsappTokenVault(config),
    },
    {
      provide: WhatsappInboxService,
      inject: [PrismaWhatsappInboxRepository, WhatsappService],
      useFactory: (repository: PrismaWhatsappInboxRepository, sender: WhatsappService) =>
        new WhatsappInboxService(repository, sender),
    },
    {
      provide: WhatsappAuthorizationService,
      inject: [
        PrismaWhatsappRepository,
        PrismaWhatsappAuthorizationStore,
        MetaWhatsappAuthorizationProvider,
        MetaWhatsappGateway,
        MetaWhatsappSignupGateway,
        AesWhatsappTokenVault,
      ],
      useFactory: (
        repository: PrismaWhatsappRepository,
        store: PrismaWhatsappAuthorizationStore,
        authorization: MetaWhatsappAuthorizationProvider,
        gateway: MetaWhatsappGateway,
        signup: MetaWhatsappSignupGateway,
        vault: AesWhatsappTokenVault,
      ) =>
        new WhatsappAuthorizationService(repository, store, authorization, gateway, signup, vault),
    },
    {
      provide: WhatsappSignupService,
      inject: [
        PrismaWhatsappRepository,
        MetaWhatsappGateway,
        MetaWhatsappSignupGateway,
        SignedWhatsappSignupState,
        AesWhatsappTokenVault,
      ],
      useFactory: (
        repository: PrismaWhatsappRepository,
        gateway: MetaWhatsappGateway,
        signup: MetaWhatsappSignupGateway,
        state: SignedWhatsappSignupState,
        vault: AesWhatsappTokenVault,
      ) => new WhatsappSignupService(repository, gateway, signup, state, vault),
    },
    {
      provide: WhatsappService,
      inject: [
        PrismaWhatsappRepository,
        MetaWhatsappGateway,
        AesWhatsappTokenVault,
        Sha256WhatsappMessageHasher,
      ],
      useFactory: (
        repository: PrismaWhatsappRepository,
        gateway: MetaWhatsappGateway,
        vault: AesWhatsappTokenVault,
        hasher: Sha256WhatsappMessageHasher,
      ) => new WhatsappService(repository, gateway, vault, hasher),
    },
  ],
})
export class WhatsappModule {}
