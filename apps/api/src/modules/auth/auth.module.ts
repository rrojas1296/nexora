import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthService } from "./services/auth.service.js";
import { AUTH_SETTINGS } from "./models/auth.js";
import { AuthSettings } from "./providers/auth-settings.js";
import { AUTH_REPOSITORY, AUTH_TOKENS, PASSWORD_HASHER } from "./contracts/auth.ports.js";
import { AUTH_COOKIES } from "./contracts/auth-cookies.js";
import { CSRF_PROTECTION } from "./contracts/csrf-protection.js";
import { SIGNED_CSRF } from "./contracts/signed-csrf.js";
import { BcryptPasswordHasher } from "./providers/bcrypt-password-hasher.js";
import { JoseAuthTokens } from "./providers/jose-auth-tokens.js";
import { PrismaAuthRepository } from "./repositories/prisma-auth-repository.js";
import { SignedCsrf } from "./providers/signed-csrf.js";
import { AuthExceptionFilter } from "./filters/auth-exception.filter.js";
import { AuthController } from "./controllers/auth.controller.js";
import { AuthCookies } from "./http/auth.cookies.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { CsrfProtection } from "./http/csrf.protection.js";

@Module({
  // The default storage is per-process; multi-instance deployments need shared storage.
  imports: [ConfigModule, DatabaseModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_SETTINGS, useClass: AuthSettings },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: AUTH_TOKENS, useClass: JoseAuthTokens },
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    AuthService,
    { provide: AUTH_COOKIES, useClass: AuthCookies },
    { provide: SIGNED_CSRF, useClass: SignedCsrf },
    { provide: CSRF_PROTECTION, useClass: CsrfProtection },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AuthExceptionFilter },
  ],
  exports: [AuthService, AUTH_COOKIES],
})
export class AuthModule {}
