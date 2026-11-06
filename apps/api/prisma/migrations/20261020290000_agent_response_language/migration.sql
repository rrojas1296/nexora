-- Existing and new agents default to Spanish. No business data is removed.
CREATE TYPE "AgentResponseLanguage" AS ENUM ('es', 'en');
ALTER TABLE "Agents" ADD COLUMN "responseLanguage" "AgentResponseLanguage" NOT NULL DEFAULT 'es';
