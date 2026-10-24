export class AuthError extends Error {
  constructor(
    readonly code: "unauthorized" | "conflict" | "forbidden" | "invalid" | "incorrect_password",
  ) {
    super(code);
  }
}

export interface Membership {
  businessId: string;
  role: string;
  business: { id: string; name: string; slug: string };
}

export interface Identity {
  user: { id: string; name: string; email: string };
  activeBusinessId: string;
  memberships: Membership[];
}

export interface CredentialsUser {
  id: string;
  passwordHash: string;
  active: boolean;
}

export interface Session {
  id: string;
  userId: string;
  businessId: string;
  expiresAt: Date;
  idleExpiresAt: Date;
}

export interface TokenClaims {
  sub: string;
  sid: string;
  businessId: string;
  jti: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
  refreshId: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export interface AuthResult {
  identity: Identity;
  session: Session;
  tokens: TokenPair;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  businessName: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CredentialsChangePasswordInput extends ChangePasswordInput {
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
  businessId?: string;
}

export interface AuthSettings {
  accessTtl: number;
  refreshTtl: number;
  sessionTtl: number;
  csrfTtl: number;
  bcryptRounds: number;
  issuer: string;
  audience: string;
  accessSecret: string;
  refreshSecret: string;
  csrfSecret: string;
  origins: string[];
  production: boolean;
}
