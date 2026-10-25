import { mockDelay } from "@/lib/mocks/mock-delay";
import { workspaceFixture } from "../mocks/workspace-fixture";
import { workspaceSchema } from "../schemas/workspace-schema";
import { commandSchema, type WorkspaceCommand } from "../schemas/command-schema";
import type { Workspace, DemoScenario } from "../types/workspace";

export class DemoDataError extends Error {
  constructor(
    public readonly code:
      | "unavailable"
      | "duplicateSku"
      | "emailTaken"
      | "missing"
      | "linked"
      | "closed",
  ) {
    super(code);
  }
}

let database: Workspace | undefined;
let generation = 0;
function getDatabase(): Workspace {
  if (typeof window === "undefined") throw new Error("DEMO_DATABASE_IS_BROWSER_ONLY");
  database ??= workspaceSchema.parse(structuredClone(workspaceFixture));
  return database;
}
export function resetMockWorkspace() {
  generation += 1;
  database = undefined;
}
function findById<T extends { id: string }>(rows: T[], id: string): T {
  const row = rows.find((item) => item.id === id);
  if (!row) throw new DemoDataError("missing");
  return row;
}
function upsert<T extends { id: string }>(rows: T[], row: T, existingId?: string) {
  if (!existingId) rows.push(row);
  else {
    findById(rows, existingId);
    rows.splice(
      rows.findIndex((item) => item.id === existingId),
      1,
      row,
    );
  }
}
function applyCommand(db: Workspace, command: WorkspaceCommand) {
  switch (command.type) {
    case "product.save": {
      if (
        db.products.some(
          (item) =>
            item.id !== command.id && item.sku.toLowerCase() === command.input.sku.toLowerCase(),
        )
      )
        throw new DemoDataError("duplicateSku");
      upsert(db.products, { ...command.input, id: command.id ?? crypto.randomUUID() }, command.id);
      break;
    }
    case "product.delete": {
      findById(db.products, command.id);
      if (db.orders.some((order) => order.items.some((item) => item.productId === command.id)))
        throw new DemoDataError("linked");
      db.products = db.products.filter((item) => item.id !== command.id);
      break;
    }
    case "client.save": {
      if (db.clients.some((item) => item.id !== command.id && item.email === command.input.email))
        throw new DemoDataError("emailTaken");
      upsert(db.clients, { ...command.input, id: command.id ?? crypto.randomUUID() }, command.id);
      break;
    }
    case "order.save": {
      findById(db.clients, command.input.clientId);
      for (const item of command.input.items) findById(db.products, item.productId);
      upsert(
        db.orders,
        { ...command.input, id: command.id ?? `ORD-${crypto.randomUUID()}` },
        command.id,
      );
      break;
    }
    case "order.status":
      findById(db.orders, command.id).status = command.status;
      break;
    case "conversation.update":
      Object.assign(findById(db.conversations, command.id), {
        status: command.status,
        assignedTo: command.assignedTo,
      });
      break;
    case "message.send": {
      const conversation = findById(db.conversations, command.id);
      if (conversation.status === "closed") throw new DemoDataError("closed");
      conversation.messages.push({
        ...command.input,
        id: crypto.randomUUID(),
        author: "team",
        createdAt: new Date().toISOString(),
      });
      break;
    }
    case "agent.save":
      db.agent = command.input;
      break;
    case "settings.save":
      db.settings = command.input;
      break;
  }
}

// Replace this adapter with Axios later. Inputs and snapshots are validated at the boundary.
export const workspaceService = {
  async read(scenario: DemoScenario, signal: AbortSignal): Promise<Workspace> {
    await mockDelay(450, signal);
    if (scenario === "error") throw new DemoDataError("unavailable");
    const snapshot = structuredClone(getDatabase());
    if (scenario === "empty")
      Object.assign(snapshot, {
        products: [],
        clients: [],
        orders: [],
        conversations: [],
      });
    return workspaceSchema.parse(snapshot);
  },
  async execute(input: WorkspaceCommand, scenario: DemoScenario): Promise<void> {
    const startedGeneration = generation;
    await mockDelay(550, new AbortController().signal);
    if (scenario !== "normal" || startedGeneration !== generation)
      throw new DemoDataError("unavailable");
    const next = structuredClone(getDatabase());
    applyCommand(next, commandSchema.parse(input));
    database = workspaceSchema.parse(next);
  },
};
