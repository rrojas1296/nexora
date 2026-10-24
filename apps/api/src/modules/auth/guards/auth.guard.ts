import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EXTERNAL_WEBHOOK_ROUTE } from "../../../common/external-webhook.js";
import { AuthService } from "../services/auth.service.js";
import { AuthError } from "../models/auth.js";
import { AuthCookies } from "../http/auth.cookies.js";
import type { AuthRequest } from "../http/auth.request.js";
import { CsrfProtection } from "../http/csrf.protection.js";
import { PUBLIC_ROUTE } from "../decorators/public.decorator.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly csrf: CsrfProtection,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    context.switchToHttp().getResponse().setHeader("Cache-Control", "no-store");
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublic) {
      const token = this.cookies.read(request, "access");
      if (!token) throw new AuthError("unauthorized");
      request.auth = await this.auth.authenticate(token);
    }
    const isExternalWebhook = this.reflector.get<boolean>(
      EXTERNAL_WEBHOOK_ROUTE,
      context.getHandler(),
    );
    if (!(isPublic && isExternalWebhook) && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      await this.csrf.protect(request);
    }
    return true;
  }
}
