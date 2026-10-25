import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import type { Environment } from "../../../config/environment.js";
import { AuthService } from "../../auth/services/auth.service.js";
import { AuthCookies } from "../../auth/http/auth.cookies.js";
import type { AuthRequest } from "../../auth/http/auth.request.js";
import { Public } from "../../auth/decorators/public.decorator.js";
import { WhatsappAuthorizationService } from "../services/whatsapp-authorization.service.js";
import { authorizationCallbackSchema } from "../dto/whatsapp-authorization.dto.js";

@ApiTags("WhatsApp")
@Controller("whatsapp/oauth")
export class WhatsappOauthCallbackController {
  constructor(
    private readonly authorization: WhatsappAuthorizationService,
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  @Get("callback")
  @Public()
  @ApiRoute({
    summary: "Callback navegador de Facebook Login (no invocar desde Swagger)",
    auth: "none",
    status: 303,
    query: authorizationCallbackSchema,
    description:
      "Autentica manualmente la cookie access para poder redirigir errores a una URL limpia. Exige state de un uso ligado a esa misma sesión/usuario/negocio y OWNER/ADMIN; nunca autentica usando solo state. Canjea código en servidor y redirige a la configuración del negocio (/{locale}/businesses/configuration). No retorna código/token. Configurar este callback HTTPS exacto en Meta y excluir query strings de logs de proxy/CDN.",
  })
  async callback(@Req() request: AuthRequest, @Res() response: Response, @Query() query: unknown) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    const configured = this.config.get("WHATSAPP_OAUTH_REDIRECT_URI", { infer: true });
    if (!configured) {
      response.status(503).send("WhatsApp authorization is not configured.");
      return;
    }
    const fallback = new URL(
      "/es/businesses/configuration?whatsappResult=failed",
      new URL(configured).origin,
    ).toString();
    let destination = fallback;
    try {
      const parsed = authorizationCallbackSchema.safeParse(query);
      const token = this.cookies.read(request, "access");
      if (parsed.success && token) {
        const { claims } = await this.auth.authenticate(token);
        if (!claims.businessId) throw new Error("BUSINESS_REQUIRED");
        destination = await this.authorization.callback(
          { userId: claims.sub, sessionId: claims.sid, businessId: claims.businessId },
          parsed.data,
        );
      }
    } catch {
      // Deliberately omit raw auth/provider/DB exceptions and all callback parameters.
    }
    response.redirect(303, destination);
  }
}
