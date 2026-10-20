import { RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import type { Environment } from "./config/environment.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
