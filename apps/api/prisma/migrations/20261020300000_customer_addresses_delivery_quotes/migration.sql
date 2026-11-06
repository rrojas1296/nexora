-- Additive migration. No legacy Client.address is copied and no pending delivery is treated as free.
CREATE TABLE "ClientAddresses" (
  "id" UUID NOT NULL, "businessId" UUID NOT NULL, "clientId" UUID NOT NULL,
  "label" TEXT NOT NULL, "address" TEXT NOT NULL, "reference" TEXT NOT NULL DEFAULT '',
  "country" TEXT NOT NULL DEFAULT '', "city" TEXT NOT NULL DEFAULT '', "district" TEXT NOT NULL DEFAULT '',
  "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION,
  "isDefault" BOOLEAN NOT NULL DEFAULT false, "version" INTEGER NOT NULL DEFAULT 0,
  "creationHash" TEXT, "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ClientAddresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientAddresses_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClientAddresses_businessId_clientId_fkey" FOREIGN KEY ("businessId", "clientId") REFERENCES "Clients"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClientAddresses_coordinates_check" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180))
);
CREATE UNIQUE INDEX "ClientAddresses_businessId_id_key" ON "ClientAddresses"("businessId", "id");
CREATE INDEX "ClientAddresses_businessId_clientId_isDeleted_idx" ON "ClientAddresses"("businessId", "clientId", "isDeleted");
CREATE UNIQUE INDEX "ClientAddresses_one_active_default" ON "ClientAddresses"("businessId", "clientId") WHERE "isDefault" AND NOT "isDeleted";
CREATE TABLE "WhatsappAddressActions" (
  "id" UUID NOT NULL, "businessId" UUID NOT NULL, "clientId" UUID NOT NULL, "threadId" UUID NOT NULL, "jobId" UUID NOT NULL,
  "token" TEXT NOT NULL, "payload" JSONB NOT NULL, "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappAddressActions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsappAddressActions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WhatsappAddressActions_businessId_clientId_fkey" FOREIGN KEY ("businessId", "clientId") REFERENCES "Clients"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WhatsappAddressActions_businessId_threadId_fkey" FOREIGN KEY ("businessId", "threadId") REFERENCES "WhatsappThreads"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WhatsappAddressActions_businessId_id_key" ON "WhatsappAddressActions"("businessId", "id");
CREATE INDEX "WhatsappAddressActions_businessId_threadId_isDeleted_idx" ON "WhatsappAddressActions"("businessId", "threadId", "isDeleted");
ALTER TABLE "Orders"
  ADD COLUMN "deliveryFee" DECIMAL(18,2),
  ADD COLUMN "deliveryQuotedBy" UUID,
  ADD COLUMN "deliveryQuotedAt" TIMESTAMPTZ(3),
  ADD COLUMN "deliveryQuoteNote" TEXT NOT NULL DEFAULT '',
  ADD CONSTRAINT "Orders_delivery_fee_check" CHECK ("deliveryFee" IS NULL OR "deliveryFee" >= 0),
  ADD CONSTRAINT "Orders_quoted_fee_check" CHECK ("deliveryQuoteStatus" <> 'QUOTED' OR "deliveryFee" IS NOT NULL);
-- Require a new fully-priced summary for any previously prepared delivery draft.
UPDATE "Orders" SET "confirmationToken" = NULL, "confirmationJobId" = NULL, "version" = "version" + 1
WHERE "status" = 'DRAFT' AND "deliveryMode" = 'DELIVERY' AND NOT "isDeleted";
