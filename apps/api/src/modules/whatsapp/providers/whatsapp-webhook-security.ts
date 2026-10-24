import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../../config/environment.js";

@Injectable()
export class WhatsappWebhookSecurity {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  verifySubscriptionToken(token: string): boolean {
    const expected = this.config.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN", { infer: true });
    if (!expected) throw new ServiceUnavailableException("WhatsApp webhook is not configured.");
    return timingSafeEqual(this.digest(token), this.digest(expected));
  }

  verifySignature(body: Buffer, signature: string | undefined): boolean {
    const secret = this.config.get("WHATSAPP_APP_SECRET", { infer: true });
    if (!secret || secret === "tu_app_secret") {
      throw new ServiceUnavailableException("WhatsApp webhook is not configured.");
    }
    if (!signature || !/^sha256=[a-fA-F0-9]{64}$/.test(signature)) return false;
    const expected = createHmac("sha256", secret).update(body).digest();
    return timingSafeEqual(expected, Buffer.from(signature.slice(7), "hex"));
  }

  private digest(value: string): Buffer {
    return createHash("sha256").update(value).digest();
  }
}
