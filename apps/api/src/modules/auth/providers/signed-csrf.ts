import type { ISignedCsrf } from "../contracts/signed-csrf.js";
import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SETTINGS, type IAuthSettings } from "../models/auth.js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

@Injectable()
export class SignedCsrf implements ISignedCsrf {
  constructor(@Inject(AUTH_SETTINGS) private readonly settings: IAuthSettings) {}

  issue(context: string): string {
    const nonce = randomBytes(32).toString("base64url");
    const expires = Math.floor(Date.now() / 1000) + this.settings.csrfTtl;
    const value = `${nonce}.${expires}`;
    return `${value}.${this.signature(context, value)}`;
  }

  verify(token: string, context: string): boolean {
    if (token.length > 256) return false;
    const parts = token.split(".");
    const [nonce, expiry, signature] = parts;
    if (
      parts.length !== 3 ||
      !nonce ||
      !expiry ||
      !signature ||
      !/^[A-Za-z0-9_-]{43}$/.test(nonce) ||
      !/^\d{1,12}$/.test(expiry)
    )
      return false;
    const expires = Number(expiry);
    const now = Math.floor(Date.now() / 1000);
    if (expires <= now || expires > now + this.settings.csrfTtl) return false;
    return this.equal(signature, this.signature(context, `${nonce}.${expiry}`));
  }

  equal(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private signature(context: string, value: string) {
    return createHmac("sha256", this.settings.csrfSecret)
      .update(`${context.length}:${context}:${value}`)
      .digest("base64url");
  }
}
