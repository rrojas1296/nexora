import { createHmac } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import type { Environment } from "../../../config/environment.js";
import type { WhatsappSignupGateway } from "../application/whatsapp.ports.js";
import { WhatsappError } from "../domain/whatsapp.js";

const tokenSchema = z.object({ access_token: z.string().min(20).max(4096) });
const debugSchema = z.object({
  data: z.object({
    app_id: z.string(),
    is_valid: z.literal(true),
    scopes: z.array(z.string()),
    granular_scopes: z.array(
      z.object({ scope: z.string(), target_ids: z.array(z.string()).optional() }),
    ),
  }),
});
const phonesSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
  paging: z
    .object({
      next: z.string().optional(),
      cursors: z.object({ after: z.string().max(2048).optional() }).optional(),
    })
    .optional(),
});
const successSchema = z.object({ success: z.literal(true) });

export class MetaWhatsappSignupGateway implements WhatsappSignupGateway {
  constructor(protected readonly config: ConfigService<Environment, true>) {}

  protected credentials() {
    const appId = this.config.get("WHATSAPP_APP_ID", { infer: true });
    const secret = this.config.get("WHATSAPP_APP_SECRET", { infer: true });
    const version = this.config.get("WHATSAPP_GRAPH_API_VERSION", { infer: true });
    if (!appId || !secret || !version) throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    return { appId, secret, version };
  }

  protected async request(
    path: string,
    parameters: URLSearchParams,
    token?: string,
    body?: object,
  ) {
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

  async exchangeCode(code: string, redirectUri?: string) {
    const { appId, secret } = this.credentials();
    const result = tokenSchema.safeParse(
      await this.request(
        "oauth/access_token",
        new URLSearchParams({
          client_id: appId,
          client_secret: secret,
          code,
          ...(redirectUri ? { redirect_uri: redirectUri } : {}),
        }),
      ),
    );
    if (!result.success) throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
    return result.data.access_token;
  }

  protected async authorizedWabas(accessToken: string): Promise<string[]> {
    const { appId, secret } = this.credentials();
    const debug = debugSchema.safeParse(
      await this.request(
        "debug_token",
        new URLSearchParams({
          input_token: accessToken,
        }),
        `${appId}|${secret}`,
      ),
    );
    if (
      !debug.success ||
      debug.data.data.app_id !== appId ||
      !debug.data.data.scopes.includes("whatsapp_business_messaging") ||
      !debug.data.data.scopes.includes("whatsapp_business_management")
    ) {
      throw new WhatsappError("WHATSAPP_INVALID_CREDENTIALS");
    }
    return [
      ...new Set(
        debug.data.data.granular_scopes
          .filter((scope) => scope.scope === "whatsapp_business_management")
          .flatMap((scope) => scope.target_ids ?? [])
          .filter((id) => /^[1-9]\d{4,29}$/.test(id)),
      ),
    ];
  }

  async verifyAssets(wabaId: string, phoneNumberId: string, accessToken: string) {
    if (!(await this.authorizedWabas(accessToken)).includes(wabaId))
      throw new WhatsappError("WHATSAPP_INVALID_CREDENTIALS");
    // Never follow provider-supplied next URLs with customer credentials.
    let after: string | undefined;
    for (let page = 0; page < 10; page++) {
      const parameters = new URLSearchParams({
        fields: "id",
        limit: "100",
        ...(after ? { after } : {}),
      });
      const phones = phonesSchema.safeParse(
        await this.request(`${wabaId}/phone_numbers`, parameters, accessToken),
      );
      if (!phones.success) throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
      if (phones.data.data.some((phone) => phone.id === phoneNumberId)) return;
      after = phones.data.paging?.next ? phones.data.paging.cursors?.after : undefined;
      if (!after) break;
    }
    throw new WhatsappError("WHATSAPP_INVALID_CREDENTIALS");
  }

  async subscribe(wabaId: string, accessToken: string) {
    const result = await this.request(
      `${wabaId}/subscribed_apps`,
      new URLSearchParams(),
      accessToken,
      {},
    );
    if (!successSchema.safeParse(result).success)
      throw new WhatsappError("WHATSAPP_SIGNUP_INCOMPLETE");
  }

  async register(phoneNumberId: string, accessToken: string, pin: string) {
    const result = await this.request(
      `${phoneNumberId}/register`,
      new URLSearchParams(),
      accessToken,
      {
        messaging_product: "whatsapp",
        pin,
      },
    );
    if (!successSchema.safeParse(result).success)
      throw new WhatsappError("WHATSAPP_SIGNUP_INCOMPLETE");
  }
}
