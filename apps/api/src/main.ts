import { RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";
import type { Environment } from "./config/environment.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser("json", { limit: "16kb" });
  app.useBodyParser("urlencoded", { extended: false, limit: "16kb" });
  app.use(cookieParser());
  const config = app.get(ConfigService<Environment, true>);
  app.setGlobalPrefix("api/v1", { exclude: [{ path: "/", method: RequestMethod.GET }] });
  app.enableCors({
    origin: config.get("CORS_ORIGINS", { infer: true }),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-Id"],
    maxAge: 600,
  });
  app.enableShutdownHooks();
  await app.listen(config.get("PORT", { infer: true }), config.get("HOST", { infer: true }));
}
await bootstrap();
