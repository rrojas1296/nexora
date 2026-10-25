import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { Identity, TokenClaims } from "../models/auth.js";

export interface AuthRequest extends Request {
  auth?: { claims: TokenClaims; identity: Identity };
}

export function getAuthenticatedActor(request: AuthRequest) {
  if (!request.auth) throw new UnauthorizedException();
  if (!request.auth.claims.businessId) throw new ForbiddenException("BUSINESS_REQUIRED");
  return {
    userId: request.auth.claims.sub,
    businessId: request.auth.claims.businessId,
    sessionId: request.auth.claims.sid,
  };
}

export function header(request: Request, name: string): string | undefined {
  const value = request.headers[name];
  return typeof value === "string" ? value : undefined;
}
