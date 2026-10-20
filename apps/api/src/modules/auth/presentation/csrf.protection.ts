import type { Response } from "express";
import { AuthService } from "../application/auth.service.js";
import { AuthError, type AuthSettings } from "../domain/auth.js";
import { SignedCsrf } from "../infrastructure/signed-csrf.js";
import { AuthCookies } from "./auth.cookies.js";
import { header, type AuthRequest } from "./auth.request.js";

export class CsrfProtection {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly signed: SignedCsrf,
    private readonly settings: AuthSettings,
  ) {}

  async bootstrap(request: AuthRequest, response: Response): Promise<string> {
    const context = (await this.context(request)) ?? this.cookies.createPreContext(response);
    const existing = this.cookies.read(request, "csrf");
    if (existing && this.signed.verify(existing, context)) return existing;
    const token = this.signed.issue(context);
    this.cookies.setCsrf(response, token);
    return token;
  }

  async protect(request: AuthRequest): Promise<void> {
    this.verifyOrigin(request);
    const token = header(request, "x-csrf-token");
    const cookie = this.cookies.read(request, "csrf");
    if (!token || token.length > 256 || !cookie || !this.signed.equal(token, cookie))
      throw new AuthError("forbidden");
    const context = await this.context(request);
    if (!context || !this.signed.verify(token, context)) throw new AuthError("forbidden");
  }

  private verifyOrigin(request: AuthRequest) {
    const origin = header(request, "origin");
    if (request.headers.origin !== undefined) {
      if (!origin || !this.settings.origins.includes(origin)) throw new AuthError("forbidden");
      return;
    }
    const referer = header(request, "referer");
    try {
      if (!referer) throw new AuthError("forbidden");
      const url = new URL(referer);
      if (url.username || url.password || !this.settings.origins.includes(url.origin))
        throw new AuthError("forbidden");
    } catch {
      throw new AuthError("forbidden");
    }
  }

  private async context(request: AuthRequest): Promise<string | undefined> {
    // CSRF binding verifies signed claims, not authorization. Revoked sessions can still
    // clear cookies via logout; protected routes and refresh independently check live DB state.
    for (const purpose of ["refresh", "access"] as const) {
      const token = this.cookies.read(request, purpose);
      if (!token) continue;
      try {
        const claims = await this.auth.verifyToken(token, purpose);
        if (request.auth && request.auth.claims.sid !== claims.sid)
          throw new AuthError("forbidden");
        return `session:${claims.sid}`;
      } catch (error) {
        if (!(error instanceof AuthError) || error.code !== "unauthorized") throw error;
      }
    }
    if (request.auth) return `session:${request.auth.claims.sid}`;
    return this.cookies.preContext(request);
  }
}
