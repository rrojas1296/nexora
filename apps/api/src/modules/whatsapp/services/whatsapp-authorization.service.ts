import { createHash, randomBytes } from "node:crypto";
import type {
  WhatsappAuthorizationProvider,
  WhatsappAuthorizationStore,
} from "../contracts/whatsapp-authorization.ports.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";
import type {
  WhatsappGateway,
  WhatsappRepository,
  WhatsappSignupGateway,
  WhatsappTokenVault,
} from "../contracts/whatsapp.ports.js";

function hash(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export class WhatsappAuthorizationService {
  constructor(
    private readonly repository: WhatsappRepository,
    private readonly store: WhatsappAuthorizationStore,
    private readonly provider: WhatsappAuthorizationProvider,
    private readonly gateway: WhatsappGateway,
    private readonly signup: WhatsappSignupGateway,
    private readonly vault: WhatsappTokenVault,
  ) {}

  async start(actor: WhatsappActor, businessId: string, locale: "es" | "en") {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
    await this.repository.authorize(actor);
    if (await this.repository.getConnection(actor))
      throw new WhatsappError("WHATSAPP_CONNECTION_CONFLICT");
    const state = randomBytes(32).toString("hex");
    const authorizationUrl = this.provider.authorizationUrl(state);
    await this.store.create(actor, hash(state), locale);
    return { authorizationUrl };
  }

  async callback(actor: WhatsappActor, input: { state: string; code?: string; error?: string }) {
    let id: string | undefined;
    let locale: "es" | "en" = "es";
    try {
      await this.repository.authorize(actor);
      const attempt = await this.store.claimCallback(actor, hash(input.state));
      id = attempt.id;
      locale = attempt.locale;
      if (input.error || !input.code) {
        await this.store.finish(actor, id, "CANCELLED");
      } else {
        const token = await this.provider.exchangeCode(input.code);
        const assets = await this.provider.assets(token);
        await this.repository.authorize(actor);
        await this.store.ready(
          actor,
          id,
          this.vault.encrypt(token, actor.businessId, `oauth:${id}`),
          assets,
        );
      }
    } catch {
      // Never log callback codes, provider exceptions, or tokens.
      if (id) await this.store.finish(actor, id, "FAILED");
    }
    return this.provider.returnUrl(locale, id);
  }

  async status(actor: WhatsappActor, businessId: string, id: string) {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
    await this.repository.authorize(actor);
    const attempt = await this.store.get(actor, id);
    return {
      id: attempt.id,
      status: attempt.status,
      expiresAt: attempt.expiresAt.toISOString(),
      assets: attempt.status === "READY" ? attempt.assets : [],
    };
  }

  async complete(
    actor: WhatsappActor,
    businessId: string,
    input: { attemptId: string; wabaId: string; phoneNumberId: string },
  ) {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
    await this.repository.authorize(actor);
    const preview = await this.store.get(actor, input.attemptId);
    if (
      !preview.assets.some(
        (asset) => asset.wabaId === input.wabaId && asset.phoneNumberId === input.phoneNumberId,
      )
    )
      throw new WhatsappError("WHATSAPP_INVALID_CREDENTIALS");
    await this.repository.assertSignupPhoneAvailable(actor, input.phoneNumberId);
    const attempt = await this.store.claimCompletion(actor, input.attemptId);
    try {
      if (!attempt.encryptedAccessToken) throw new WhatsappError("WHATSAPP_SIGNUP_EXPIRED");
      const token = this.vault.decrypt(
        attempt.encryptedAccessToken,
        actor.businessId,
        `oauth:${attempt.id}`,
      );
      await this.signup.verifyAssets(input.wabaId, input.phoneNumberId, token);
      const phone = await this.gateway.verifyPhone(input.phoneNumberId, token);
      await this.repository.assertSignupPhoneAvailable(actor, input.phoneNumberId);
      await this.signup.subscribe(input.wabaId, token);
      const connection = await this.repository.saveConnection(
        actor,
        {
          ...phone,
          encryptedAccessToken: this.vault.encrypt(token, actor.businessId, input.phoneNumberId),
        },
        true,
      );
      await this.store.finish(actor, attempt.id, "CONNECTED");
      return connection;
    } catch (error) {
      await this.store.finish(actor, attempt.id, "FAILED");
      throw error;
    }
  }
}
