-- Review and apply explicitly; no migration is run by install/build/start.
BEGIN;
CREATE TABLE "WhatsappThreads" (
  "id" UUID NOT NULL,
  "businessId" UUID NOT NULL,
  "phoneNumberId" TEXT NOT NULL,
  "contactWaId" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMPTZ(3) NOT NULL,
  "lastMessageBody" TEXT NOT NULL,
  "lastMessageType" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "WhatsappThreads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsappThreads_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WhatsappThreads_businessId_id_key" ON "WhatsappThreads"("businessId", "id");
CREATE UNIQUE INDEX "WhatsappThreads_businessId_phoneNumberId_contactWaId_key" ON "WhatsappThreads"("businessId", "phoneNumberId", "contactWaId");
CREATE INDEX "WhatsappThreads_businessId_isDeleted_lastMessageAt_id_idx" ON "WhatsappThreads"("businessId", "isDeleted", "lastMessageAt", "id");
CREATE TABLE "WhatsappInboundMessages" (
  "id" UUID NOT NULL,
  "businessId" UUID NOT NULL,
  "threadId" UUID NOT NULL,
  "providerMessageId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "sentAt" TIMESTAMPTZ(3) NOT NULL,
  "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "WhatsappInboundMessages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsappInboundMessages_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WhatsappInboundMessages_businessId_threadId_fkey" FOREIGN KEY ("businessId", "threadId") REFERENCES "WhatsappThreads"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WhatsappInboundMessages_businessId_providerMessageId_key" ON "WhatsappInboundMessages"("businessId", "providerMessageId");
CREATE INDEX "WhatsappInboundMessages_thread_timeline_idx" ON "WhatsappInboundMessages"("businessId", "threadId", "isDeleted", "sentAt", "id");
COMMIT;
