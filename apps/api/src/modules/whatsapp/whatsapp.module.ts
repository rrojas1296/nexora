import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaWhatsappRepository } from "./repositories/prisma-whatsapp-repository.js";
import { WHATSAPP_REPOSITORY } from "./contracts/whatsapp.ports.js";
import { PrismaWhatsappInboxRepository } from "./repositories/prisma-whatsapp-inbox-repository.js";
import { WHATSAPP_INBOX_REPOSITORY } from "./repositories/whatsapp-inbox.repository.js";
import { PrismaWhatsappAuthorizationStore } from "./repositories/prisma-whatsapp-authorization-store.js";
import { WHATSAPP_AUTHORIZATION_STORE } from "./contracts/whatsapp-authorization.ports.js";
import { PrismaWhatsappAiStore } from "./repositories/prisma-whatsapp-ai-store.js";
import { WHATSAPP_AI_STORE } from "./contracts/whatsapp-ai-store.js";
import { PrismaWhatsappCommerce } from "./repositories/prisma-whatsapp-commerce.js";
import { WHATSAPP_COMMERCE_REPOSITORY } from "./contracts/whatsapp-commerce.js";
import { PrismaWhatsappTools } from "./repositories/prisma-whatsapp-tools.js";
import { AI_TOOL_EXECUTOR } from "./contracts/ai-tools.js";
import { OpenAiTextGenerator } from "./providers/openai-text-generator.js";
import { AI_TEXT_GENERATOR } from "./contracts/ai-text-generator.js";
import { MetaWhatsappGateway } from "./providers/meta-whatsapp-gateway.js";
import { WHATSAPP_GATEWAY } from "./contracts/whatsapp.ports.js";
import { MetaWhatsappSignupGateway } from "./providers/meta-whatsapp-signup-gateway.js";
import { WHATSAPP_SIGNUP_GATEWAY } from "./contracts/whatsapp.ports.js";
import { MetaWhatsappAuthorizationProvider } from "./providers/meta-whatsapp-authorization-provider.js";
import { WHATSAPP_AUTHORIZATION_PROVIDER } from "./contracts/whatsapp-authorization.ports.js";
import { SignedWhatsappSignupState } from "./providers/whatsapp-signup-state.js";
import { WHATSAPP_SIGNUP_STATE } from "./contracts/whatsapp.ports.js";
import { AesWhatsappTokenVault } from "./providers/whatsapp-token-vault.js";
import { WHATSAPP_TOKEN_VAULT } from "./contracts/whatsapp.ports.js";
import { Sha256WhatsappMessageHasher } from "./providers/whatsapp-message-hasher.js";
import { WHATSAPP_MESSAGE_HASHER } from "./contracts/whatsapp.ports.js";
import { MetaWhatsappGraphClient } from "./providers/meta-whatsapp-graph-client.js";
import { META_WHATSAPP_GRAPH_CLIENT } from "./contracts/meta-whatsapp-graph-client.js";
import { WhatsappWebhookSecurity } from "./providers/whatsapp-webhook-security.js";
import { WHATSAPP_WEBHOOK_SECURITY } from "./contracts/whatsapp-webhook-security.js";
import { WhatsappService } from "./services/whatsapp.service.js";
import { WhatsappInboxService } from "./services/whatsapp-inbox.service.js";
import { WhatsappAuthorizationService } from "./services/whatsapp-authorization.service.js";
import { WhatsappSignupService } from "./services/whatsapp-signup.service.js";
import { WhatsappAiService } from "./services/whatsapp-ai.service.js";
import { WhatsappCommerceService } from "./services/whatsapp-commerce.service.js";
import { WhatsappAuthorizationController } from "./controllers/whatsapp-authorization.controller.js";
import { WhatsappCommerceController } from "./controllers/whatsapp-commerce.controller.js";
import { WhatsappInboxController } from "./controllers/whatsapp-inbox.controller.js";
import { WhatsappOauthCallbackController } from "./controllers/whatsapp-oauth-callback.controller.js";
import { WhatsappWebhookController } from "./controllers/whatsapp-webhook.controller.js";
import { WhatsappController } from "./controllers/whatsapp.controller.js";
import { WhatsappSignatureGuard } from "./guards/whatsapp-signature.guard.js";
import { WHATSAPP_AI_WORKER } from "./contracts/whatsapp-ai-worker.js";
import { WHATSAPP_MEDIA_WORKER } from "./contracts/whatsapp-media-worker.js";
import { WhatsappAiWorker } from "./providers/whatsapp-ai-worker.js";
import { WhatsappMediaWorker } from "./providers/whatsapp-media-worker.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    WhatsappAuthorizationController,
    WhatsappCommerceController,
    WhatsappInboxController,
    WhatsappOauthCallbackController,
    WhatsappWebhookController,
    WhatsappController,
  ],
  providers: [
    { provide: WHATSAPP_REPOSITORY, useClass: PrismaWhatsappRepository },
    { provide: WHATSAPP_INBOX_REPOSITORY, useClass: PrismaWhatsappInboxRepository },
    { provide: WHATSAPP_AUTHORIZATION_STORE, useClass: PrismaWhatsappAuthorizationStore },
    { provide: WHATSAPP_AI_STORE, useClass: PrismaWhatsappAiStore },
    { provide: WHATSAPP_COMMERCE_REPOSITORY, useClass: PrismaWhatsappCommerce },
    { provide: AI_TOOL_EXECUTOR, useClass: PrismaWhatsappTools },
    { provide: AI_TEXT_GENERATOR, useClass: OpenAiTextGenerator },
    { provide: WHATSAPP_GATEWAY, useClass: MetaWhatsappGateway },
    { provide: WHATSAPP_SIGNUP_GATEWAY, useClass: MetaWhatsappSignupGateway },
    { provide: WHATSAPP_AUTHORIZATION_PROVIDER, useClass: MetaWhatsappAuthorizationProvider },
    { provide: WHATSAPP_SIGNUP_STATE, useClass: SignedWhatsappSignupState },
    { provide: WHATSAPP_TOKEN_VAULT, useClass: AesWhatsappTokenVault },
    { provide: WHATSAPP_MESSAGE_HASHER, useClass: Sha256WhatsappMessageHasher },
    { provide: META_WHATSAPP_GRAPH_CLIENT, useClass: MetaWhatsappGraphClient },
    { provide: WHATSAPP_WEBHOOK_SECURITY, useClass: WhatsappWebhookSecurity },
    WhatsappService,
    WhatsappInboxService,
    WhatsappAuthorizationService,
    WhatsappSignupService,
    WhatsappAiService,
    WhatsappCommerceService,
    WhatsappSignatureGuard,
    { provide: WHATSAPP_AI_WORKER, useClass: WhatsappAiWorker },
    { provide: WHATSAPP_MEDIA_WORKER, useClass: WhatsappMediaWorker },
  ],
})
export class WhatsappModule {}
