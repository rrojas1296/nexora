import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Environment } from "../../config/environment.js";

export function setupSwagger(app: INestApplication, config: ConfigService<Environment, true>) {
  const production = config.get("NODE_ENV", { infer: true }) === "production";
  const enabled = config.get("SWAGGER_ENABLED", { infer: true }) ?? !production;
  if (!enabled) return;

  const cookiePrefix = production ? "__Host-" : "dev-";
  const options = new DocumentBuilder()
    .setTitle("Nexora API")
    .setVersion("1.0")
    .setDescription(
      [
        "API actual: autenticación, negocio, productos, agente y WhatsApp. No hay endpoints de pedidos/clientes/tiendas/inbox.",
        "Autenticación por cookies HttpOnly, NO Bearer JWT. En el mismo navegador: GET /api/v1/auth/csrf, copiar data.csrfToken en X-CSRF-Token y hacer login. Volver a obtener CSRF después del login/registro.",
        "Las cookies se gestionan por el navegador: Authorize no puede establecer cookies HttpOnly. En producción usar HTTPS. Origin/Referer del Swagger UI debe estar admitido por CORS_ORIGINS; no se relajan CSRF ni los guards.",
        "Try it out ejecuta operaciones REALES, incluidos envío WhatsApp, borrados y cambio de contraseña. El webhook aún descarta los eventos. El access token de Meta solo va en PUT connection.",
      ].join("\n\n"),
    )
    .addCookieAuth(
      `${cookiePrefix}access`,
      {
        type: "apiKey",
        in: "cookie",
        description: "Sesión HttpOnly establecida al iniciar sesión; no pegar Bearer tokens.",
      },
      "accessCookie",
    )
    .addCookieAuth(
      `${cookiePrefix}refresh`,
      { type: "apiKey", in: "cookie", description: "Refresh HttpOnly rotativo de uso único." },
      "refreshCookie",
    )
    .build();

  // No compiler plugin: schemas are explicit and reuse runtime Zod definitions.
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("api/v1/docs", app, document, {
    jsonDocumentUrl: "api/v1/docs-json",
    yamlDocumentUrl: "api/v1/docs-yaml",
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: false,
      validatorUrl: null,
      docExpansion: "none",
      displayRequestDuration: true,
    },
    customSiteTitle: "Nexora API — Swagger",
  });
}
