import type { Request } from "express";
import type { Identity, TokenClaims } from "../domain/auth.js";

export interface AuthRequest extends Request {
  auth?: { claims: TokenClaims; identity: Identity };
}

export function header(request: Request, name: string): string | undefined {
  const value = request.headers[name];
  return typeof value === "string" ? value : undefined;
}
