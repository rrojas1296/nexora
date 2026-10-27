import type { Prisma } from "../../database/generated/client.js";
import { CommerceError, type CommerceActor } from "./commerce.js";

export async function authorizeCommerce(
  tx: Prisma.TransactionClient,
  actor: CommerceActor,
  write = false,
) {
  const [membership] = await tx.$queryRaw<{ role: string }[]>`
    SELECT m."role" FROM "Memberships" m
    JOIN "Businesses" b ON b."id" = m."businessId"
    JOIN "Users" u ON u."id" = m."userId"
    JOIN "AuthSessions" s ON s."businessId" = m."businessId" AND s."userId" = m."userId"
    WHERE m."businessId" = ${actor.businessId}::uuid AND m."userId" = ${actor.userId}::uuid
      AND m."active" AND NOT m."isDeleted" AND NOT b."isDeleted" AND u."active" AND NOT u."isDeleted"
      AND s."id" = ${actor.sessionId}::uuid AND NOT s."isDeleted" AND s."revokedAt" IS NULL
      AND s."expiresAt" > CURRENT_TIMESTAMP AND s."idleExpiresAt" > CURRENT_TIMESTAMP
    FOR SHARE OF b, m
  `;
  if (!membership || (write && !["OWNER", "ADMIN"].includes(membership.role)))
    throw new CommerceError("COMMERCE_FORBIDDEN");
}
