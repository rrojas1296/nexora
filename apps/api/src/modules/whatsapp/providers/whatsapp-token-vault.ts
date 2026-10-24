import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../../config/environment.js";
import type { WhatsappTokenVault } from "../contracts/whatsapp.ports.js";
import { WhatsappError } from "../models/whatsapp.js";

export class AesWhatsappTokenVault implements WhatsappTokenVault {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  private key(): Buffer {
    const value = this.config.get("WHATSAPP_CREDENTIALS_KEY", { infer: true });
    if (!value) throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    const key = Buffer.from(value, "base64");
    if (key.length !== 32) throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    return key;
  }

  encrypt(token: string, businessId: string, phoneNumberId: string): string {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), nonce);
    cipher.setAAD(Buffer.from(`${businessId}:${phoneNumberId}`));
    const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    return [
      "v1",
      nonce.toString("base64"),
      cipher.getAuthTag().toString("base64"),
      encrypted.toString("base64"),
    ].join(".");
  }

  decrypt(token: string, businessId: string, phoneNumberId: string): string {
    try {
      const [version, nonce, tag, encrypted, extra] = token.split(".");
      if (version !== "v1" || !nonce || !tag || !encrypted || extra !== undefined) {
        throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
      }
      const decipher = createDecipheriv("aes-256-gcm", this.key(), Buffer.from(nonce, "base64"));
      decipher.setAAD(Buffer.from(`${businessId}:${phoneNumberId}`));
      decipher.setAuthTag(Buffer.from(tag, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    }
  }
}
