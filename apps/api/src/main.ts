import { RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { setupSwagger } from "./common/documentation/setup-swagger.js";
import { AppModule } from "./app.module.js";
import type { Environment } from "./config/environment.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    rawBody: true,
  });
  app.useBodyParser("json", {
    type: (request) =>
      request.url?.split("?")[0] === "/api/v1/whatsapp/webhook" &&
      /^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] ?? ""),
    limit: "1mb",
    inflate: false,
  });
  app.useBodyParser("json", {
    type: (request) =>
      /^\/api\/v1\/businesses(?:\/[\da-f-]{36})?$/.test(request.url?.split("?")[0] ?? "") &&
      /^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] ?? ""),
    limit: "128kb",
    inflate: false,
  });
  app.useBodyParser("json", { limit: "16kb" });
  app.useBodyParser("urlencoded", { extended: false, limit: "16kb" });
  app.use(cookieParser());
  const config = app.get(ConfigService<Environment, true>);
  app.setGlobalPrefix("api/v1", { exclude: [{ path: "/", method: RequestMethod.GET }] });
  app.enableCors({
    origin: config.get("CORS_ORIGINS", { infer: true }),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-Id", "Idempotency-Key"],
    maxAge: 600,
  });
  setupSwagger(app, config);
  app.enableShutdownHooks();
  await app.listen(config.get("PORT", { infer: true }), config.get("HOST", { infer: true }));
}
await bootstrap();
