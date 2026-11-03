import { AuthService } from "../services/auth.service.js";
import { Inject, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { CSRF_PROTECTION, type ICsrfProtection } from "../contracts/csrf-protection.js";
import { AUTH_COOKIES, type IAuthCookies } from "../contracts/auth-cookies.js";
import { Reflector } from "@nestjs/core";
import { EXTERNAL_WEBHOOK_ROUTE } from "../../../common/external-webhook.js";
import { AuthError } from "../models/auth.js";
import type { AuthRequest } from "../http/auth.request.js";
import { PUBLIC_ROUTE } from "../decorators/public.decorator.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    @Inject(AUTH_COOKIES) private readonly cookies: IAuthCookies,
    @Inject(CSRF_PROTECTION) private readonly csrf: ICsrfProtection,
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
