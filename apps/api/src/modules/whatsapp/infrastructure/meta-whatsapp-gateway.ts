import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import type { Environment } from "../../../config/environment.js";
import type { WhatsappGateway, WhatsappSendResult } from "../application/whatsapp.ports.js";
import { WhatsappError, type WhatsappMessage } from "../domain/whatsapp.js";

const errorSchema = z.object({
  error: z.object({ code: z.number().int().nonnegative().max(2147483647) }),
});
const phoneSchema = z.object({
  id: z.string(),
  display_phone_number: z.string().max(100),
  verified_name: z.string().max(300),
});
const sentSchema = z.object({
  messages: z.array(z.object({ id: z.string().min(1).max(512) })).min(1),
});

function payload(message: WhatsappMessage) {
  const common = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: message.to,
    type: message.type,
  };
  if (message.type === "text") {
    return { ...common, text: { body: message.text.body, preview_url: message.text.previewUrl } };
  }
  return {
    ...common,
    template: {
      name: message.template.name,
      language: { code: message.template.language },
      ...(message.template.bodyParameters.length
        ? {
            components: [
              {
                type: "body",
                parameters: message.template.bodyParameters.map((text) => ({ type: "text", text })),
              },
            ],
          }
        : {}),
    },
  };
}

export class MetaWhatsappGateway implements WhatsappGateway {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  private url(phoneNumberId: string, suffix = ""): string {
    const version = this.config.get("WHATSAPP_GRAPH_API_VERSION", { infer: true });
    if (!version) throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    return `https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}${suffix}`;
  }

  async verifyPhone(phoneNumberId: string, accessToken: string) {
    const url = this.url(phoneNumberId, "?fields=id,display_phone_number,verified_name");
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
    }
    if ([400, 401, 403, 404].includes(response.status)) {
      await response.body?.cancel();
      throw new WhatsappError("WHATSAPP_INVALID_CREDENTIALS");
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
    }
    const parsed = phoneSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success || parsed.data.id !== phoneNumberId) {
      throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
    }
    return {
      phoneNumberId,
      displayPhoneNumber: parsed.data.display_phone_number,
      verifiedName: parsed.data.verified_name,
    };
  }

  async send(
    phoneNumberId: string,
    accessToken: string,
    message: WhatsappMessage,
  ): Promise<WhatsappSendResult> {
    // Configuration errors occur before any outbound request, so rejection is certain.
    let url: string;
    try {
      url = this.url(phoneNumberId, "/messages");
    } catch {
      return { status: "REJECTED", providerMessageId: null };
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload(message)),
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        const error = errorSchema.safeParse(await response.json().catch(() => null));
        return {
          status:
            response.status >= 400 && response.status < 500 && response.status !== 408
              ? "REJECTED"
              : "UNKNOWN",
          providerMessageId: null,
          providerHttpStatus: response.status,
          providerErrorCode: error.success ? error.data.error.code : null,
        };
      }
      const parsed = sentSchema.safeParse(await response.json().catch(() => null));
      const id = parsed.success ? parsed.data.messages[0]?.id : undefined;
      return id
        ? { status: "ACCEPTED", providerMessageId: id, providerHttpStatus: response.status }
        : { status: "UNKNOWN", providerMessageId: null, providerHttpStatus: response.status };
    } catch {
      // Timeout/network errors may occur after Meta accepted the message. Never retry.
      return { status: "UNKNOWN", providerMessageId: null };
    }
  }
}
