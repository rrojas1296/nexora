-- Explicit deployment only, after the inbox and multiple-businesses migrations.
CREATE TYPE "WhatsappControlMode" AS ENUM ('AI', 'HUMAN');
CREATE TYPE "WhatsappAiJobStatus" AS ENUM ('QUEUED', 'GENERATING', 'SENDING', 'ACCEPTED', 'FAILED', 'UNKNOWN', 'CANCELLED', 'SKIPPED');
ALTER TABLE "WhatsappThreads"
  ADD COLUMN "controlMode" "WhatsappControlMode" NOT NULL DEFAULT 'AI',
  ADD COLUMN "controlVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WhatsappInboundMessages" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'HUMAN';
UPDATE "WhatsappInboundMessages" SET "source" = 'CUSTOMER' WHERE "direction" = 'INBOUND';
CREATE UNIQUE INDEX "WhatsappInboundMessages_businessId_threadId_id_key"
  ON "WhatsappInboundMessages" ("businessId", "threadId", "id");
CREATE TABLE "WhatsappAiReplyJobs" (
  "id" UUID NOT NULL,
  "businessId" UUID NOT NULL,
  "threadId" UUID NOT NULL,
  "triggerMessageId" UUID NOT NULL,
  "threadVersion" INTEGER NOT NULL,
  "status" "WhatsappAiJobStatus" NOT NULL DEFAULT 'QUEUED',
  "reason" TEXT,
  "provider" TEXT,
  "model" TEXT,
  "contextVersion" INTEGER,
  "startedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "WhatsappAiReplyJobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsappAiReplyJobs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WhatsappAiReplyJobs_businessId_threadId_fkey" FOREIGN KEY ("businessId", "threadId") REFERENCES "WhatsappThreads"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WhatsappAiReplyJobs_businessId_threadId_triggerMessageId_fkey" FOREIGN KEY ("businessId", "threadId", "triggerMessageId") REFERENCES "WhatsappInboundMessages"("businessId", "threadId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WhatsappAiReplyJobs_triggerMessageId_key" ON "WhatsappAiReplyJobs"("triggerMessageId");
CREATE INDEX "WhatsappAiReplyJobs_status_isDeleted_createdAt_idx" ON "WhatsappAiReplyJobs"("status", "isDeleted", "createdAt");
CREATE INDEX "WhatsappAiReplyJobs_businessId_threadId_createdAt_idx" ON "WhatsappAiReplyJobs"("businessId", "threadId", "createdAt");
CREATE INDEX "WhatsappAiReplyJobs_businessId_startedAt_idx" ON "WhatsappAiReplyJobs"("businessId", "startedAt");
-- No history is scheduled, no agents are enabled and no business context is published.
