import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "../application/auth.service.js";
import { AuthError } from "../domain/auth.js";
import { AuthCookies } from "./auth.cookies.js";
import { loginSchema, parseDto, registerSchema } from "./auth.dto.js";
import type { AuthRequest } from "./auth.request.js";
import { CsrfProtection } from "./csrf.protection.js";
import { Public } from "./public.decorator.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly csrf: CsrfProtection,
  ) {}

  @Public()
  @Get("csrf")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async bootstrap(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    return { data: { csrfToken: await this.csrf.bootstrap(request, response) } };
  }

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(parseDto(registerSchema, body));
    this.cookies.setTokens(response, result.tokens, true);
    return { data: result.identity };
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(parseDto(loginSchema, body));
    this.cookies.setTokens(response, result.tokens, true);
    return { data: result.identity };
  }

  @Get("me")
  me(@Req() request: AuthRequest) {
    if (!request.auth) throw new AuthError("unauthorized");
    return { data: request.auth.identity };
  }

  @Public()
  @Post("refresh")
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    const token = this.cookies.read(request, "refresh");
    if (!token) throw new AuthError("unauthorized");
    const result = await this.auth.refresh(token);
    // The stable session ID keeps the existing signed CSRF binding valid.
    this.cookies.setTokens(response, result.tokens, false);
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(this.cookies.read(request, "refresh"), "refresh");
    await this.auth.logout(this.cookies.read(request, "access"), "access");
    this.cookies.clear(response);
  }

  @Post("logout-all")
  @HttpCode(204)
  async logoutAll(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    if (!request.auth) throw new AuthError("unauthorized");
    await this.auth.logoutAll(request.auth.claims);
    this.cookies.clear(response);
  }
}
