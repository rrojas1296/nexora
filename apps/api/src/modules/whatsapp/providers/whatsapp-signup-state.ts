import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../../config/environment.js";
import type { WhatsappSignupState } from "../contracts/whatsapp.ports.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";

const audience = "nexora-whatsapp-embedded-signup";

export class SignedWhatsappSignupState implements WhatsappSignupState {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  private key() {
    return new TextEncoder().encode(this.config.get("AUTH_CSRF_SECRET", { infer: true }));
  }

  async configuration(actor: WhatsappActor) {
    const appId = this.config.get("WHATSAPP_APP_ID", { infer: true });
    const configId = this.config.get("WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID", { infer: true });
    const graphVersion = this.config.get("WHATSAPP_GRAPH_API_VERSION", { infer: true });
    const secret = this.config.get("WHATSAPP_APP_SECRET", { infer: true });
    const encryptionKey = this.config.get("WHATSAPP_CREDENTIALS_KEY", { infer: true });
    if (
      !appId ||
      !configId ||
      !graphVersion ||
      !secret ||
      !encryptionKey ||
      ["whatsapp_api_secret_token", "tu_app_secret_real"].includes(secret)
    ) {
      throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    }
    const state = await new SignJWT({ businessId: actor.businessId, sessionId: actor.sessionId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(this.config.get("AUTH_ISSUER", { infer: true }))
      .setAudience(audience)
      .setSubject(actor.userId)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(this.key());
    return { appId, configId, graphVersion, state };
  }

  async verify(actor: WhatsappActor, state: string) {
    try {
      const { payload } = await jwtVerify(state, this.key(), {
        algorithms: ["HS256"],
        issuer: this.config.get("AUTH_ISSUER", { infer: true }),
        audience,
        subject: actor.userId,
        maxTokenAge: "15m",
      });
      if (payload.businessId !== actor.businessId || payload.sessionId !== actor.sessionId) {
        throw new Error("SIGNUP_CONTEXT_MISMATCH");
      }
    } catch {
      throw new WhatsappError("WHATSAPP_SIGNUP_EXPIRED");
    }
  }
}
