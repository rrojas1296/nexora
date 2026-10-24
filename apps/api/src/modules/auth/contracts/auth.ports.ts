import type {
  AuthResult,
  CredentialsUser,
  Identity,
  RegisterInput,
  Session,
  TokenClaims,
  TokenPair,
} from "../models/auth.js";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash?: string): Promise<boolean>;
}

export interface AuthTokens {
  issue(session: Session): Promise<TokenPair>;
  verify(token: string, purpose: "access" | "refresh"): Promise<TokenClaims>;
  hash(token: string): string;
}

export type IssueTokens = (session: Session) => Promise<TokenPair>;

export interface AuthRepository {
  findCredentials(email: string): Promise<CredentialsUser | null>;
  findCredentialsById(userId: string): Promise<CredentialsUser | null>;
  changePassword(
    claims: TokenClaims,
    previousHash: string,
    newHash: string,
  ): Promise<void>;
  changePasswordWithCredentials(
    userId: string,
    previousHash: string,
    newHash: string,
  ): Promise<void>;
  register(
    input: Omit<RegisterInput, "password">,
    hash: string,
    issue: IssueTokens,
  ): Promise<AuthResult>;
  startSession(
    userId: string,
    businessId: string | undefined,
    passwordHash: string,
    issue: IssueTokens,
  ): Promise<AuthResult>;
  current(claims: TokenClaims): Promise<Identity>;
  rotate(
    claims: TokenClaims,
    hash: string,
    issue: IssueTokens,
  ): Promise<AuthResult>;
  revoke(claims: TokenClaims, all: boolean): Promise<void>;
}
