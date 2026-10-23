-- Explicit deployment only. Does not connect to Meta or modify existing business data.
BEGIN;
CREATE TABLE "WhatsappConnections" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT NOT NULL,
    "verifiedName" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "WhatsappConnections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WhatsappConnections_businessId_key" ON "WhatsappConnections"("businessId");
CREATE UNIQUE INDEX "WhatsappConnections_phoneNumberId_key" ON "WhatsappConnections"("phoneNumberId");
ALTER TABLE "WhatsappConnections" ADD CONSTRAINT "WhatsappConnections_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "WhatsappSendStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'UNKNOWN');
CREATE TABLE "WhatsappSendAttempts" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "WhatsappSendStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "providerErrorCode" INTEGER,
    "providerHttpStatus" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "WhatsappSendAttempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WhatsappSendAttempts_businessId_idempotencyKey_key"
    ON "WhatsappSendAttempts"("businessId", "idempotencyKey");
CREATE INDEX "WhatsappSendAttempts_businessId_createdAt_idx"
    ON "WhatsappSendAttempts"("businessId", "createdAt");
ALTER TABLE "WhatsappSendAttempts" ADD CONSTRAINT "WhatsappSendAttempts_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;
