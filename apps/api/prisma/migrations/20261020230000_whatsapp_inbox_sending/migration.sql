-- Additive migration: the legacy inbox table now holds both message directions.
-- Review destination, backup and pending migrations, then apply explicitly.
BEGIN;
CREATE TYPE "WhatsappInboxDirection" AS ENUM ('INBOUND', 'OUTBOUND');
ALTER TABLE "WhatsappInboundMessages"
  ALTER COLUMN "providerMessageId" DROP NOT NULL,
  ADD COLUMN "direction" "WhatsappInboxDirection" NOT NULL DEFAULT 'INBOUND',
  ADD COLUMN "sendAttemptId" UUID;
CREATE UNIQUE INDEX "WhatsappSendAttempts_businessId_id_key" ON "WhatsappSendAttempts"("businessId", "id");
CREATE UNIQUE INDEX "WhatsappInboundMessages_businessId_sendAttemptId_key" ON "WhatsappInboundMessages"("businessId", "sendAttemptId");
ALTER TABLE "WhatsappInboundMessages" ADD CONSTRAINT "WhatsappInboundMessages_businessId_sendAttemptId_fkey"
  FOREIGN KEY ("businessId", "sendAttemptId") REFERENCES "WhatsappSendAttempts"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WhatsappInboundMessages" ADD CONSTRAINT "WhatsappInboundMessages_direction_fields_check"
  CHECK (("direction" = 'INBOUND' AND "providerMessageId" IS NOT NULL AND "sendAttemptId" IS NULL)
    OR ("direction" = 'OUTBOUND' AND "sendAttemptId" IS NOT NULL));
CREATE INDEX "WhatsappInboundMessages_reply_window_idx" ON "WhatsappInboundMessages"("businessId", "threadId", "direction", "isDeleted", "sentAt");
COMMIT;
