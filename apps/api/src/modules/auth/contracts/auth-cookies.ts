import type { TokenPair } from "../models/auth.js";
import type { Request, Response } from "express";

export const AUTH_COOKIES = Symbol("IAuthCookies");

export interface IAuthCookies {
  readonly names: { access: string; refresh: string; csrf: string; pre: string };
  read(request: Request, kind: "access" | "refresh" | "csrf" | "pre"): string | undefined;
  setTokens(response: Response, tokens: TokenPair, invalidateCsrf: boolean): void;
  preContext(request: Request): string | undefined;
  createPreContext(response: Response): string;
  setCsrf(response: Response, token: string): void;
  clear(response: Response): void;
}
