import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "../../../infrastructure/database/generated/client.js";
import type { AuthRepository, IssueTokens } from "../application/auth.ports.js";
import {
  AuthError,
  type AuthSettings,
  type Identity,
  type RegisterInput,
  type Session,
  type TokenClaims,
  type TokenPair,
} from "../domain/auth.js";

type Transaction = Prisma.TransactionClient;

export class PrismaAuthRepository implements AuthRepository {
  constructor(
    private readonly client: PrismaClient,
    private readonly settings: AuthSettings,
  ) {}

  findCredentials(email: string) {
    return this.client.user.findUnique({
      where: { email, isDeleted: false },
      select: { id: true, passwordHash: true, active: true },
    });
  }

  findCredentialsById(userId: string) {
    return this.client.user.findUnique({
      where: { id: userId, active: true, isDeleted: false },
      select: { id: true, passwordHash: true, active: true },
    });
  }

  changePassword(claims: TokenClaims, previousHash: string, newHash: string): Promise<void> {
    return this.replacePassword(claims.sub, previousHash, newHash, claims);
  }

  changePasswordWithCredentials(
    userId: string,
    previousHash: string,
    newHash: string,
  ): Promise<void> {
    return this.replacePassword(userId, previousHash, newHash);
  }

  private async replacePassword(
    userId: string,
    previousHash: string,
    newHash: string,
    claims?: TokenClaims,
  ): Promise<void> {
    await this.client.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      if (claims) await this.requireSession(tx, claims);
      const updated = await tx.user.updateMany({
        where: { id: userId, passwordHash: previousHash, active: true, isDeleted: false },
        data: { passwordHash: newHash },
      });
      if (updated.count !== 1) throw new AuthError("unauthorized");
      await this.revokeAll(tx, userId, new Date());
    });
  }

  async register(input: Omit<RegisterInput, "password">, passwordHash: string, issue: IssueTokens) {
    try {
      return await this.client.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name: input.name, email: input.email, passwordHash },
        });
        const prefix =
          input.businessName
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60) || "business";
        const business = await tx.business.create({
          data: { name: input.businessName, slug: `${prefix}-${randomUUID()}` },
        });
        await tx.membership.create({
          data: { userId: user.id, businessId: business.id, role: "OWNER" },
        });
        return this.createSession(tx, user.id, business.id, issue);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new AuthError("conflict");
      throw error;
    }
  }

  startSession(
    userId: string,
    businessId: string | undefined,
    passwordHash: string,
    issue: IssueTokens,
  ) {
    return this.client.$transaction(async (tx) => {
      // Serialize login with password changes, then recheck the hash verified by bcrypt.
      await this.lockUser(tx, userId);
      const user = await tx.user.findFirst({
        where: { id: userId, passwordHash, active: true, isDeleted: false },
        select: { id: true },
      });
      if (!user) throw new AuthError("unauthorized");
      return this.createSession(tx, userId, businessId, issue);
    });
  }

  async current(claims: TokenClaims): Promise<Identity> {
    await this.requireSession(this.client, claims);
    return this.identity(this.client, claims.sub, claims.businessId);
  }

  private async requireSession(tx: Transaction, claims: TokenClaims): Promise<void> {
    const now = new Date();
    const session = await tx.authSession.findFirst({
      where: {
        id: claims.sid,
        isDeleted: false,
        userId: claims.sub,
        businessId: claims.businessId,
        revokedAt: null,
        expiresAt: { gt: now },
        idleExpiresAt: { gt: now },
        membership: {
          active: true,
          isDeleted: false,
          user: { active: true, isDeleted: false },
          business: { isDeleted: false },
        },
      },
      select: { id: true },
    });
    if (!session) throw new AuthError("unauthorized");
  }

  async rotate(claims: TokenClaims, hash: string, issue: IssueTokens) {
    const result = await this.client.$transaction(async (tx) => {
      // Every refresh in a family locks the same row before inspecting/consuming a token.
      await this.lockFamily(tx, claims);
      const now = new Date();
      const session = await tx.authSession.findFirst({
        where: {
          id: claims.sid,
          userId: claims.sub,
          businessId: claims.businessId,
          isDeleted: false,
        },
      });
      if (!session || session.revokedAt || session.expiresAt <= now || session.idleExpiresAt <= now)
        return null;
      const token = await tx.refreshSession.findFirst({
        where: {
          id: claims.jti,
          familyId: claims.sid,
          userId: claims.sub,
          businessId: claims.businessId,
          refreshTokenHash: hash,
          isDeleted: false,
        },
      });
      if (!token || token.consumedAt || token.revokedAt) {
        await this.revokeFamily(tx, claims, now);
        return null; // Commit revocation even though the request is rejected outside the transaction.
      }
      const membership = await tx.membership.findFirst({
        where: {
          userId: claims.sub,
          businessId: claims.businessId,
          active: true,
          isDeleted: false,
          user: { active: true, isDeleted: false },
          business: { isDeleted: false },
        },
      });
      if (!membership || token.expiresAt <= now) {
        await this.revokeFamily(tx, claims, now);
        return null;
      }
      const consumed = await tx.refreshSession.updateMany({
        where: { id: token.id, consumedAt: null, revokedAt: null, isDeleted: false },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        await this.revokeFamily(tx, claims, now);
        return null;
      }
      const renewed = await tx.authSession.update({
        where: { id: session.id, isDeleted: false },
        data: {
          idleExpiresAt: new Date(
            Math.min(session.expiresAt.getTime(), now.getTime() + this.settings.refreshTtl * 1000),
          ),
        },
      });
      const tokens = await issue(renewed);
      await this.storeRefresh(tx, renewed, tokens);
      return {
        identity: await this.identity(tx, claims.sub, claims.businessId),
        session: renewed,
        tokens,
      };
    });
    if (!result) throw new AuthError("unauthorized");
    return result;
  }

  async revoke(claims: TokenClaims, all: boolean): Promise<void> {
    await this.client.$transaction(async (tx) => {
      const now = new Date();
      if (all) {
        await this.revokeAll(tx, claims.sub, now);
      } else {
        await this.lockFamily(tx, claims);
        await this.revokeFamily(tx, claims, now);
      }
    });
  }

  private async createSession(
    tx: Transaction,
    userId: string,
    businessId: string | undefined,
    issue: IssueTokens,
  ) {
    const memberships = await tx.membership.findMany({
      where: {
        userId,
        active: true,
        isDeleted: false,
        user: { active: true, isDeleted: false },
        business: { isDeleted: false },
        ...(businessId ? { businessId } : {}),
      },
      orderBy: [{ createdAt: "asc" }, { businessId: "asc" }],
      select: { businessId: true },
    });
    const selected = memberships[0];
    if (!selected) throw new AuthError("unauthorized");
    const now = Date.now();
    const expiresAt = new Date(now + this.settings.sessionTtl * 1000);
    const session = await tx.authSession.create({
      data: {
        id: randomUUID(),
        userId,
        businessId: selected.businessId,
        expiresAt,
        idleExpiresAt: new Date(
          Math.min(expiresAt.getTime(), now + this.settings.refreshTtl * 1000),
        ),
      },
    });
    const tokens = await issue(session);
    await this.storeRefresh(tx, session, tokens);
    return { identity: await this.identity(tx, userId, selected.businessId), session, tokens };
  }

  private async identity(tx: Transaction, userId: string, businessId: string): Promise<Identity> {
    const user = await tx.user.findFirst({
      where: { id: userId, active: true, isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          where: { active: true, isDeleted: false, business: { isDeleted: false } },
          orderBy: [{ createdAt: "asc" }, { businessId: "asc" }],
          select: {
            businessId: true,
            role: true,
            business: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!user || !user.memberships.some((membership) => membership.businessId === businessId))
      throw new AuthError("unauthorized");
    const { memberships, ...profile } = user;
    return { user: profile, activeBusinessId: businessId, memberships };
  }

  private storeRefresh(tx: Transaction, session: Session, tokens: TokenPair) {
    return tx.refreshSession.create({
      data: {
        id: tokens.refreshId,
        businessId: session.businessId,
        userId: session.userId,
        familyId: session.id,
        refreshTokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.refreshExpiresAt,
      },
    });
  }

  private lockUser(tx: Transaction, userId: string) {
    // NO KEY UPDATE serializes credentials without blocking refresh FK key-share locks.
    return tx.$queryRaw`SELECT "id" FROM "Users" WHERE "id" = ${userId}::uuid FOR NO KEY UPDATE`;
  }

  private async revokeAll(tx: Transaction, userId: string, now: Date): Promise<void> {
    // Lock families before tokens, matching refresh. Include soft-deleted rows deliberately.
    await tx.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  private lockFamily(tx: Transaction, claims: TokenClaims) {
    return tx.$queryRaw`SELECT "id" FROM "AuthSessions" WHERE "id" = ${claims.sid}::uuid AND "userId" = ${claims.sub}::uuid AND "businessId" = ${claims.businessId}::uuid FOR UPDATE`;
  }

  private async revokeFamily(tx: Transaction, claims: TokenClaims, now: Date) {
    // Revocation includes deleted rows so restoring one cannot undo a logout or replay response.
    const where = { userId: claims.sub, businessId: claims.businessId, revokedAt: null };
    await tx.authSession.updateMany({
      where: { ...where, id: claims.sid },
      data: { revokedAt: now },
    });
    await tx.refreshSession.updateMany({
      where: { ...where, familyId: claims.sid },
      data: { revokedAt: now },
    });
  }
}
