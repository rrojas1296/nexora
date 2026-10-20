import { randomUUID } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import type { AuthSettings, TokenPair } from "../domain/auth.js";

export class AuthCookies {
  readonly names: { access: string; refresh: string; csrf: string; pre: string };
  private readonly options: CookieOptions;

  constructor(private readonly settings: AuthSettings) {
    const prefix = settings.production ? "__Host-" : "dev-";
    this.names = {
      access: `${prefix}access`,
      refresh: `${prefix}refresh`,
      csrf: `${prefix}csrf`,
      pre: `${prefix}preauth`,
    };
    this.options = { httpOnly: true, secure: settings.production, sameSite: "lax", path: "/" };
  }

  read(request: Request, kind: keyof AuthCookies["names"]): string | undefined {
    const cookies: unknown = request.cookies;
    if (!cookies || typeof cookies !== "object" || !Object.hasOwn(cookies, this.names[kind]))
      return undefined;
    const value: unknown = (cookies as Record<string, unknown>)[this.names[kind]];
    return typeof value === "string" && value.length > 0 && value.length <= 4096
      ? value
      : undefined;
  }

  setTokens(response: Response, tokens: TokenPair, invalidateCsrf: boolean) {
    response.cookie(this.names.access, tokens.access, {
      ...this.options,
      expires: tokens.accessExpiresAt,
    });
    response.cookie(this.names.refresh, tokens.refresh, {
      ...this.options,
      expires: tokens.refreshExpiresAt,
    });
    if (invalidateCsrf) {
      response.clearCookie(this.names.csrf, this.options);
      response.clearCookie(this.names.pre, this.options);
    }
  }

  preContext(request: Request): string | undefined {
    const value = this.read(request, "pre");
    return value && /^[0-9a-f-]{36}$/.test(value) ? `pre:${value}` : undefined;
  }

  createPreContext(response: Response): string {
    const value = randomUUID();
    response.cookie(this.names.pre, value, {
      ...this.options,
      maxAge: this.settings.csrfTtl * 1000,
    });
    return `pre:${value}`;
  }

  setCsrf(response: Response, token: string) {
    response.cookie(this.names.csrf, token, {
      ...this.options,
      maxAge: this.settings.csrfTtl * 1000,
    });
  }

  clear(response: Response) {
    for (const name of Object.values(this.names)) response.clearCookie(name, this.options);
  }
}
