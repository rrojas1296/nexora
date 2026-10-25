import { createHash, randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { AuthTokens } from "../contracts/auth.ports.js";
import {
  AuthError,
  type AuthSettings,
  type Session,
  type TokenClaims,
  type TokenPair,
} from "../models/auth.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class JoseAuthTokens implements AuthTokens {
  constructor(private readonly settings: AuthSettings) {}

  async issue(session: Session): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const end = Math.floor(
      Math.min(session.expiresAt.getTime(), session.idleExpiresAt.getTime()) / 1000,
    );
    const accessExp = Math.min(now + this.settings.accessTtl, end);
    const refreshExp = Math.min(now + this.settings.refreshTtl, end);
    if (end <= now) throw new AuthError("unauthorized");
    const refreshId = randomUUID();
    const [access, refresh] = await Promise.all([
      this.sign(session, "access", randomUUID(), now, accessExp),
      this.sign(session, "refresh", refreshId, now, refreshExp),
    ]);
    return {
      access,
      refresh,
      refreshId,
      refreshTokenHash: this.hash(refresh),
      accessExpiresAt: new Date(accessExp * 1000),
      refreshExpiresAt: new Date(refreshExp * 1000),
    };
  }

  async verify(token: string, purpose: "access" | "refresh"): Promise<TokenClaims> {
    try {
      if (token.length > 4096) throw new AuthError("unauthorized");
      const { payload, protectedHeader } = await jwtVerify(token, this.key(purpose), {
        algorithms: ["HS256"],
        issuer: this.settings.issuer,
        audience: this.settings.audience,
        requiredClaims: ["exp", "iat", "sub", "jti", "sid", "purpose"],
      });
      if (protectedHeader.typ !== "JWT" || payload.purpose !== purpose)
        throw new AuthError("unauthorized");
      const claims = {
        sub: payload.sub,
        sid: payload.sid,
        businessId: payload.businessId,
        jti: payload.jti,
      };
      if (
        claims.businessId !== null &&
        (typeof claims.businessId !== "string" || !uuid.test(claims.businessId))
      )
        throw new AuthError("unauthorized");
      for (const value of [claims.sub, claims.sid, claims.jti]) {
        if (typeof value !== "string" || !uuid.test(value)) throw new AuthError("unauthorized");
      }
      return claims as TokenClaims;
    } catch {
      throw new AuthError("unauthorized");
    }
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private key(purpose: "access" | "refresh") {
    return new TextEncoder().encode(
      purpose === "access" ? this.settings.accessSecret : this.settings.refreshSecret,
    );
  }

  private sign(
    session: Session,
    purpose: "access" | "refresh",
    jti: string,
    now: number,
    exp: number,
  ) {
    return new SignJWT({ sid: session.id, businessId: session.businessId, purpose })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(this.settings.issuer)
      .setAudience(this.settings.audience)
      .setSubject(session.userId)
      .setJti(jti)
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(this.key(purpose));
  }
}
