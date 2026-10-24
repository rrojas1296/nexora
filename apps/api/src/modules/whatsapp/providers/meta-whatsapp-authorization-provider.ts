import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import type { Environment } from "../../../config/environment.js";
import { MetaWhatsappGraphClient } from "./meta-whatsapp-graph-client.js";
import type { WhatsappAuthorizedAsset } from "../models/whatsapp-authorization.js";
import type { WhatsappAuthorizationProvider } from "../contracts/whatsapp-authorization.ports.js";
import { WhatsappError } from "../models/whatsapp.js";
import { MetaWhatsappSignupGateway } from "./meta-whatsapp-signup-gateway.js";

const pageSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().regex(/^[1-9]\d{4,29}$/),
      display_phone_number: z.string().max(100),
      verified_name: z.string().max(256),
      platform_type: z.string().optional(),
    }),
  ),
  paging: z
    .object({
      next: z.string().optional(),
      cursors: z.object({ after: z.string().max(2048).optional() }).optional(),
    })
    .optional(),
});

export class MetaWhatsappAuthorizationProvider implements WhatsappAuthorizationProvider {
  constructor(
    private readonly config: ConfigService<Environment, true>,
    private readonly graph: MetaWhatsappGraphClient,
    private readonly signup: MetaWhatsappSignupGateway,
  ) {}

  private configuration() {
    const credentials = this.graph.credentials();
    const configId = this.config.get("WHATSAPP_LOGIN_CONFIG_ID", { infer: true });
    const redirectUri = this.config.get("WHATSAPP_OAUTH_REDIRECT_URI", { infer: true });
    if (!configId || !redirectUri || !this.config.get("WHATSAPP_CREDENTIALS_KEY", { infer: true }))
      throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
    return { ...credentials, configId, redirectUri };
  }

  authorizationUrl(state: string) {
    const { appId, version, configId, redirectUri } = this.configuration();
    const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    url.search = new URLSearchParams({
      client_id: appId,
      config_id: configId,
      redirect_uri: redirectUri,
      state,
      response_type: "code",
    }).toString();
    return url.toString();
  }

  returnUrl(locale: "es" | "en", attemptId?: string) {
    const { redirectUri } = this.configuration();
    const url = new URL(`/${locale}/settings`, new URL(redirectUri).origin);
    if (attemptId) url.searchParams.set("whatsappAttempt", attemptId);
    else url.searchParams.set("whatsappResult", "failed");
    return url.toString();
  }

  exchangeCode(code: string) {
    return this.signup.exchangeCode(code, this.configuration().redirectUri);
  }

  async assets(token: string): Promise<WhatsappAuthorizedAsset[]> {
    const deadline = Date.now() + 45_000;
    const wabas = await this.signup.authorizedWabas(token);
    if (!wabas.length || wabas.length > 20) throw new WhatsappError("WHATSAPP_INVALID_CREDENTIALS");
    const assets: WhatsappAuthorizedAsset[] = [];
    for (const wabaId of wabas) {
      let after: string | undefined;
      for (let page = 0; page < 10; page++) {
        if (Date.now() >= deadline) throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
        const response = pageSchema.safeParse(
          await this.graph.request(
            `${wabaId}/phone_numbers`,
            new URLSearchParams({
              fields: "id,display_phone_number,verified_name,platform_type",
              limit: "100",
              ...(after ? { after } : {}),
            }),
            token,
          ),
        );
        if (!response.success) throw new WhatsappError("WHATSAPP_PROVIDER_UNAVAILABLE");
        for (const phone of response.data.data) {
          // Only existing Cloud API assets; no On-Premises migration or registration here.
          if (phone.platform_type === "CLOUD_API")
            assets.push({
              wabaId,
              phoneNumberId: phone.id,
              displayPhoneNumber: phone.display_phone_number,
              verifiedName: phone.verified_name,
            });
        }
        if (assets.length > 200) throw new WhatsappError("WHATSAPP_SIGNUP_INCOMPLETE");
        after = response.data.paging?.next ? response.data.paging.cursors?.after : undefined;
        if (!after) break;
      }
    }
    if (!assets.length) throw new WhatsappError("WHATSAPP_SIGNUP_INCOMPLETE");
    return assets;
  }
}
