import {
  AuthError,
  type ChangePasswordInput,
  type CredentialsChangePasswordInput,
  type LoginInput,
  type RegisterInput,
  type TokenClaims,
} from "../models/auth.js";
import type { AuthRepository, AuthTokens, PasswordHasher } from "../contracts/auth.ports.js";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: AuthTokens,
  ) {}

  async register(input: RegisterInput) {
    const passwordHash = await this.passwords.hash(input.password);
    const { password: _password, ...account } = input;
    return this.repository.register(account, passwordHash, (session) => this.tokens.issue(session));
  }

  async login(input: LoginInput) {
    const user = await this.repository.findCredentials(input.email);
    const matches = await this.passwords.verify(input.password, user?.passwordHash);
    if (!user?.active || !matches) throw new AuthError("unauthorized");
    return this.repository.startSession(user.id, input.businessId, user.passwordHash, (session) =>
      this.tokens.issue(session),
    );
  }

  switchBusiness(claims: TokenClaims, businessId: string) {
    return this.repository.switchBusiness(claims, businessId, (session) =>
      this.tokens.issue(session),
    );
  }

  async changePassword(claims: TokenClaims, input: ChangePasswordInput): Promise<void> {
    const user = await this.repository.findCredentialsById(claims.sub);
    if (!user?.active) throw new AuthError("unauthorized");
    const matches = await this.passwords.verify(input.currentPassword, user.passwordHash);
    if (!matches) throw new AuthError("incorrect_password");
    const hash = await this.passwords.hash(input.newPassword);
    await this.repository.changePassword(claims, user.passwordHash, hash);
  }

  async changePasswordWithCredentials(input: CredentialsChangePasswordInput): Promise<void> {
    const user = await this.repository.findCredentials(input.email);
    // Verify even for an unknown email, using the hasher's dummy hash.
    const matches = await this.passwords.verify(input.currentPassword, user?.passwordHash);
    if (!user?.active || !matches) throw new AuthError("unauthorized");
    const hash = await this.passwords.hash(input.newPassword);
    await this.repository.changePasswordWithCredentials(user.id, user.passwordHash, hash);
  }

  verifyToken(token: string, purpose: "access" | "refresh") {
    return this.tokens.verify(token, purpose);
  }

  async authenticate(token: string, purpose: "access" | "refresh" = "access") {
    const claims = await this.tokens.verify(token, purpose);
    const identity = await this.repository.current(claims);
    return { claims, identity };
  }

  async refresh(token: string) {
    const claims = await this.tokens.verify(token, "refresh");
    return this.repository.rotate(claims, this.tokens.hash(token), (session) =>
      this.tokens.issue(session),
    );
  }

  async logout(token: string | undefined, purpose: "access" | "refresh") {
    if (!token) return;
    let claims: TokenClaims;
    try {
      claims = await this.tokens.verify(token, purpose);
    } catch (error) {
      if (error instanceof AuthError) return;
      throw error;
    }
    await this.repository.revoke(claims, false);
  }

  async logoutAll(claims: TokenClaims) {
    await this.repository.revoke(claims, true);
  }
}
