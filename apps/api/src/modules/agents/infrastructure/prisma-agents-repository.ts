import {
  Prisma,
  type PrismaClient,
  type Agent as AgentRecord,
} from "../../../infrastructure/database/generated/client.js";
import type { AgentsRepository } from "../application/agents.repository.js";
import {
  AgentError,
  type AgentActor,
  type AgentConfiguration,
  type AgentInput,
} from "../domain/agent.js";

const tones = {
  friendly: "FRIENDLY",
  professional: "PROFESSIONAL",
  concise: "CONCISE",
} as const;
const responseTones = {
  FRIENDLY: "friendly",
  PROFESSIONAL: "professional",
  CONCISE: "concise",
} as const;

function serialize(agent: AgentRecord): AgentConfiguration {
  return {
    id: agent.id,
    name: agent.name,
    tone: responseTones[agent.tone],
    instructions: agent.instructions,
    greeting: agent.greeting,
    enabled: agent.active,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  };
}

export class PrismaAgentsRepository implements AgentsRepository {
  constructor(private readonly client: PrismaClient) {}

  private async authorize(tx: Prisma.TransactionClient, actor: AgentActor, write = false) {
    // Lock the business before the first-save lookup: nullable storeId is not a
    // unique singleton key in PostgreSQL. All configuration writes follow this lock.
    const locks = write
      ? Prisma.sql`FOR NO KEY UPDATE OF b FOR SHARE OF m`
      : Prisma.sql`FOR SHARE OF m, b`;
    const [membership] = await tx.$queryRaw<{ role: string }[]>`
      SELECT m."role"::text AS "role" FROM "Memberships" m
      JOIN "Businesses" b ON b."id" = m."businessId"
      JOIN "Users" u ON u."id" = m."userId"
      JOIN "AuthSessions" s ON s."businessId" = m."businessId" AND s."userId" = m."userId"
      WHERE m."businessId" = ${actor.businessId}::uuid AND m."userId" = ${actor.userId}::uuid
        AND m."active" AND NOT m."isDeleted" AND NOT b."isDeleted"
        AND u."active" AND NOT u."isDeleted"
        AND s."id" = ${actor.sessionId}::uuid AND NOT s."isDeleted" AND s."revokedAt" IS NULL
        AND s."expiresAt" > CURRENT_TIMESTAMP AND s."idleExpiresAt" > CURRENT_TIMESTAMP
      ${locks}
    `;
    if (!membership || (write && !["OWNER", "ADMIN"].includes(membership.role))) {
      throw new AgentError("AGENT_FORBIDDEN");
    }
  }

  getConfiguration(actor: AgentActor) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      const agents = await tx.agent.findMany({
        where: { businessId: actor.businessId, storeId: null },
        take: 2,
      });
      if (agents.length > 1 || agents[0]?.isDeleted) {
        throw new AgentError("AGENT_CONFIGURATION_CONFLICT");
      }
      return agents[0] ? serialize(agents[0]) : null;
    });
  }

  saveConfiguration(actor: AgentActor, input: AgentInput) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor, true);
      // Include deleted records deliberately to avoid silently restoring/replacing
      // a reserved general configuration. Store-specific agents remain untouched.
      const agents = await tx.agent.findMany({
        where: { businessId: actor.businessId, storeId: null },
        take: 2,
      });
      if (agents.length > 1 || agents[0]?.isDeleted) {
        throw new AgentError("AGENT_CONFIGURATION_CONFLICT");
      }
      const { enabled, tone, ...fields } = input;
      const data = { ...fields, tone: tones[tone], active: enabled };
      if (agents[0]) {
        const [agent] = await tx.agent.updateManyAndReturn({
          where: {
            id: agents[0].id,
            businessId: actor.businessId,
            storeId: null,
            isDeleted: false,
          },
          data,
        });
        if (!agent) throw new AgentError("AGENT_CONFIGURATION_CONFLICT");
        return serialize(agent);
      }
      return serialize(
        await tx.agent.create({ data: { ...data, businessId: actor.businessId, storeId: null } }),
      );
    });
  }
}
