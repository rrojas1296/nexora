import type { AuthRequest } from "../http/auth.request.js";
import type { Response } from "express";

export const CSRF_PROTECTION = Symbol("ICsrfProtection");

export interface ICsrfProtection {
  bootstrap(request: AuthRequest, response: Response): Promise<string>;
  protect(request: AuthRequest): Promise<void>;
}
