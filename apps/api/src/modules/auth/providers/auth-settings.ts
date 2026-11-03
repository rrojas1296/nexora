import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../../config/environment.js";
import type { IAuthSettings } from "../models/auth.js";

@Injectable()
export class AuthSettings implements IAuthSettings {
  readonly accessTtl: number;
  readonly refreshTtl: number;
  readonly sessionTtl: number;
  readonly csrfTtl: number;
  readonly bcryptRounds: number;
  readonly issuer: string;
  readonly audience: string;
  readonly accessSecret: string;
  readonly refreshSecret: string;
  readonly csrfSecret: string;
  readonly origins: string[];
  readonly production: boolean;

  constructor(config: ConfigService<Environment, true>) {
    this.accessTtl = config.get("AUTH_ACCESS_TTL_SECONDS", { infer: true });
    this.refreshTtl = config.get("AUTH_REFRESH_TTL_SECONDS", { infer: true });
    this.sessionTtl = config.get("AUTH_SESSION_TTL_SECONDS", { infer: true });
    this.csrfTtl = config.get("AUTH_CSRF_TTL_SECONDS", { infer: true });
    this.bcryptRounds = config.get("BCRYPT_ROUNDS", { infer: true });
    this.issuer = config.get("AUTH_ISSUER", { infer: true });
    this.audience = config.get("AUTH_AUDIENCE", { infer: true });
    this.accessSecret = config.get("AUTH_ACCESS_SECRET", { infer: true });
    this.refreshSecret = config.get("AUTH_REFRESH_SECRET", { infer: true });
    this.csrfSecret = config.get("AUTH_CSRF_SECRET", { infer: true });
    this.origins = config.get("CORS_ORIGINS", { infer: true });
    this.production = config.get("NODE_ENV", { infer: true }) === "production";
  }
}
