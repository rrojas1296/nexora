import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import type { Environment } from "../../config/environment.js";
import { DatabaseModule } from "../../infrastructure/database/database.module.js";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { AuthService } from "./application/auth.service.js";
import type { AuthSettings } from "./domain/auth.js";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher.js";
import { JoseAuthTokens } from "./infrastructure/jose-auth-tokens.js";
import { PrismaAuthRepository } from "./infrastructure/prisma-auth-repository.js";
import { SignedCsrf } from "./infrastructure/signed-csrf.js";
import { AuthExceptionFilter } from "./presentation/auth-exception.filter.js";
import { AuthController } from "./presentation/auth.controller.js";
import { AuthCookies } from "./presentation/auth.cookies.js";
import { AuthGuard } from "./presentation/auth.guard.js";
import { CsrfProtection } from "./presentation/csrf.protection.js";

const AUTH_SETTINGS = Symbol("AUTH_SETTINGS");

function settings(config: ConfigService<Environment, true>): AuthSettings {
  return {
    accessTtl: config.get("AUTH_ACCESS_TTL_SECONDS", { infer: true }),
    refreshTtl: config.get("AUTH_REFRESH_TTL_SECONDS", { infer: true }),
    sessionTtl: config.get("AUTH_SESSION_TTL_SECONDS", { infer: true }),
    csrfTtl: config.get("AUTH_CSRF_TTL_SECONDS", { infer: true }),
    bcryptRounds: config.get("BCRYPT_ROUNDS", { infer: true }),
    issuer: config.get("AUTH_ISSUER", { infer: true }),
    audience: config.get("AUTH_AUDIENCE", { infer: true }),
    accessSecret: config.get("AUTH_ACCESS_SECRET", { infer: true }),
    refreshSecret: config.get("AUTH_REFRESH_SECRET", { infer: true }),
    csrfSecret: config.get("AUTH_CSRF_SECRET", { infer: true }),
    origins: config.get("CORS_ORIGINS", { infer: true }),
    production: config.get("NODE_ENV", { infer: true }) === "production",
  };
}

@Module({
  // The default storage is per-process; multi-instance deployments need shared storage.
  imports: [ConfigModule, DatabaseModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_SETTINGS, inject: [ConfigService], useFactory: settings },
    {
      provide: BcryptPasswordHasher,
      inject: [AUTH_SETTINGS],
      useFactory: async (config: AuthSettings) => {
        const hasher = new BcryptPasswordHasher(config.bcryptRounds);
        await hasher.ready();
        return hasher;
      },
    },
    {
      provide: JoseAuthTokens,
      inject: [AUTH_SETTINGS],
      useFactory: (config: AuthSettings) => new JoseAuthTokens(config),
    },
    {
      provide: PrismaAuthRepository,
      inject: [PrismaService, AUTH_SETTINGS],
      useFactory: (prisma: PrismaService, config: AuthSettings) =>
        new PrismaAuthRepository(prisma.client, config),
    },
    {
      provide: AuthService,
      inject: [PrismaAuthRepository, BcryptPasswordHasher, JoseAuthTokens],
      useFactory: (
        repository: PrismaAuthRepository,
        passwords: BcryptPasswordHasher,
        tokens: JoseAuthTokens,
      ) => new AuthService(repository, passwords, tokens),
    },
    {
      provide: AuthCookies,
      inject: [AUTH_SETTINGS],
      useFactory: (config: AuthSettings) => new AuthCookies(config),
    },
    {
      provide: SignedCsrf,
      inject: [AUTH_SETTINGS],
      useFactory: (config: AuthSettings) => new SignedCsrf(config),
    },
    {
      provide: CsrfProtection,
      inject: [AuthService, AuthCookies, SignedCsrf, AUTH_SETTINGS],
      useFactory: (
        auth: AuthService,
        cookies: AuthCookies,
        signed: SignedCsrf,
        config: AuthSettings,
      ) => new CsrfProtection(auth, cookies, signed, config),
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AuthExceptionFilter },
  ],
  exports: [AuthService],
})
export class AuthModule {}
