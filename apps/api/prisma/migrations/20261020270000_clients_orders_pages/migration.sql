-- Additive commerce pages/customer linkage; no deletions or external connections.
ALTER TABLE "Clients"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "country" DROP NOT NULL,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "creationHash" TEXT;
ALTER TABLE "Orders" ADD COLUMN "creationHash" TEXT;
ALTER TABLE "WhatsappThreads" ADD COLUMN "clientId" UUID;
CREATE INDEX "Clients_businessId_isDeleted_createdAt_id_idx" ON "Clients"("businessId", "isDeleted", "createdAt", "id");
CREATE INDEX "WhatsappThreads_businessId_clientId_idx" ON "WhatsappThreads"("businessId", "clientId");
ALTER TABLE "WhatsappThreads" ADD CONSTRAINT "WhatsappThreads_businessId_clientId_fkey"
  FOREIGN KEY ("businessId", "clientId") REFERENCES "Clients"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
