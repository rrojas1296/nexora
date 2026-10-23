import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { csrfResponse, identityResponse } from "../../../common/documentation/response-schemas.js";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "../application/auth.service.js";
import { AuthError } from "../domain/auth.js";
import { AuthCookies } from "./auth.cookies.js";
import {
  changePasswordSchema,
  credentialsChangePasswordSchema,
  loginSchema,
  parseDto,
  registerSchema,
} from "./auth.dto.js";
import type { AuthRequest } from "./auth.request.js";
import { CsrfProtection } from "./csrf.protection.js";
import { Public } from "./public.decorator.js";

@ApiTags("Autenticación")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly csrf: CsrfProtection,
  ) {}

  @Public()
  @Get("csrf")
  @ApiRoute({
    summary: "Obtener CSRF y su cookie de contexto",
    auth: "none",
    response: csrfResponse,
    description:
      "Conservar cookies. Volver a solicitar después de login/registro. No devuelve JWT.",
  })
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async bootstrap(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    return {
      data: { csrfToken: await this.csrf.bootstrap(request, response) },
    };
  }

  @Public()
  @Post("register")
  @ApiRoute({
    summary: "Registrar usuario y negocio",
    auth: "none",
    csrf: true,
    body: registerSchema,
    response: identityResponse,
    status: 201,
    errors: { 409: "Cuenta existente." },
    description:
      "Contraseña nueva: al menos 8 caracteres Unicode, una letra y un número; máximo 72 bytes UTF-8. Crea sesión en cookies HttpOnly.",
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(parseDto(registerSchema, body));
    this.cookies.setTokens(response, result.tokens, true);
    return { data: result.identity };
  }

  @Public()
  @Post("login")
  @ApiRoute({
    summary: "Iniciar sesión",
    auth: "none",
    csrf: true,
    body: loginSchema,
    response: identityResponse,
    errors: { 401: "Credenciales inválidas o cuenta no disponible." },
    description:
      "Devuelve perfil y establece cookies HttpOnly, no un Bearer token. businessId es opcional.",
  })
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(parseDto(loginSchema, body));
    this.cookies.setTokens(response, result.tokens, true);
    return { data: result.identity };
  }

  @Get("me")
  @ApiRoute({
    summary: "Consultar perfil de la sesión",
    response: identityResponse,
  })
  me(@Req() request: AuthRequest) {
    if (!request.auth) throw new AuthError("unauthorized");
    return { data: request.auth.identity };
  }

  @Public()
  @Post("refresh")
  @ApiRoute({
    summary: "Rotar sesión mediante cookie refresh",
    auth: "refresh",
    csrf: true,
    status: 204,
    description: "Rotación de uso único. No reintentar automáticamente ante respuesta incierta.",
  })
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
  @ApiRoute({
    summary: "Cerrar la sesión actual",
    auth: "none",
    csrf: true,
    status: 204,
    description:
      "Usa cookies access/refresh si existen, revoca la sesión y elimina cookies locales. Admite contexto preautenticado.",
  })
  @HttpCode(204)
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(this.cookies.read(request, "refresh"), "refresh");
    await this.auth.logout(this.cookies.read(request, "access"), "access");
    this.cookies.clear(response);
  }

  @Post("change-password")
  @ApiRoute({
    summary: "Cambiar contraseña autenticado",
    csrf: true,
    body: changePasswordSchema,
    status: 204,
    description:
      "Exige contraseña actual. Nueva: mínimo 8 caracteres Unicode, letra y número, máximo 72 bytes UTF-8 y distinta de la actual. Revoca todas las sesiones.",
    errors: {
      400: "Body inválido o INCORRECT_PASSWORD: contraseña actual incorrecta.",
      401: "Sesión inválida.",
    },
  })
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @Body() body: unknown,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!request.auth) throw new AuthError("unauthorized");
    await this.auth.changePassword(request.auth.claims, parseDto(changePasswordSchema, body));
    this.cookies.clear(response);
  }

  @Public()
  @Post("change-password-with-credentials")
  @ApiRoute({
    summary: "Cambiar contraseña con credenciales",
    auth: "none",
    csrf: true,
    body: credentialsChangePasswordSchema,
    status: 204,
    description:
      "No es recuperación por email: exige contraseña actual. Nueva: mínimo 8 caracteres Unicode, letra y número, máximo 72 bytes UTF-8 y distinta de la actual. Revoca todas las sesiones.",
    errors: { 401: "Credenciales inválidas." },
  })
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePasswordWithCredentials(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.changePasswordWithCredentials(parseDto(credentialsChangePasswordSchema, body));
    this.cookies.clear(response);
  }

  @Post("logout-all")
  @ApiRoute({
    summary: "Revocar todas las sesiones del usuario",
    csrf: true,
    status: 204,
  })
  @HttpCode(204)
  async logoutAll(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    if (!request.auth) throw new AuthError("unauthorized");
    await this.auth.logoutAll(request.auth.claims);
    this.cookies.clear(response);
  }
}
