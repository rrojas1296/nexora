export interface BusinessActor {
  userId: string;
  activeBusinessId: string | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  description: string;
  currency: string;
  timezone: string;
  contextDraft: string;
  contextPublished: string;
  contextVersion: number;
  contextPublishedAt: Date | null;
  revision: number;
}

export interface CreateBusinessInput {
  id: string;
  name: string;
  description: string;
  currency: string;
  timezone: string;
  contextDraft: string;
  agentName: string;
  agentTone: "friendly" | "professional" | "concise";
}

export interface UpdateBusinessInput {
  name: string;
  description?: string;
  currency?: string;
  timezone?: string;
  contextDraft?: string;
  publish?: boolean;
  revision?: number;
}
