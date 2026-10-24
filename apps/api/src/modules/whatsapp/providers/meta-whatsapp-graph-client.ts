import { createHmac } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../../config/environment.js";
import { WhatsappError } from "../models/whatsapp.js";

export class MetaWhatsappGraphClient {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  credentials() {
    const appId = this.config.get("WHATSAPP_APP_ID", { infer: true });
    const secret = this.config.get("WHATSAPP_APP_SECRET", { infer: true });
    const version = this.config.get("WHATSAPP_GRAPH_API_VERSION", { infer: true });
    if (!appId || !secret || !version) throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    return { appId, secret, version };
  }

  async request(path: string, parameters: URLSearchParams, token?: string, body?: object) {
    const { version, secret } = this.credentials();
    if (token)
      parameters.set("appsecret_proof", createHmac("sha256", secret).update(token).digest("hex"));
    const url = new URL(`https://graph.facebook.com/${version}/${path}`);
    url.search = parameters.toString();
    try {
      const response = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new WhatsappError(
          response.status >= 500 || response.status === 408 || response.status === 429
            ? "WHATSAPP_PROVIDER_UNAVAILABLE"
            : "WHATSAPP_INVALID_CREDENTIALS",
        );
      }
      return (await response.json()) as unknown;
    } catch (error) {
      // Fetch errors can contain URLs with secrets. Never propagate the raw exception.
      if (error instanceof WhatsappError) throw error;
      throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
    }
  }
}
