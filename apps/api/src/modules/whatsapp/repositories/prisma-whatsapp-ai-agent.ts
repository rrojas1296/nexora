import type { Prisma } from "../../../database/generated/client.js";

// Match the agent module's singleton reservation rule, including soft-deleted rows.
export async function findAutomationAgent(tx: Prisma.TransactionClient, businessId: string) {
  const agents = await tx.agent.findMany({
    where: {
      businessId,
      storeId: null,
      business: { isDeleted: false, contextVersion: { gt: 0 }, contextPublished: { not: "" } },
    },
    take: 2,
  });
  const agent = agents[0];
  return agents.length === 1 && agent && !agent.isDeleted && agent.active ? agent : null;
}
