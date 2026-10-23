-- Reviewed schema change only. Apply explicitly with prisma migrate deploy.
CREATE TABLE "WhatsappAuthorizationAttempts" (
  "id" UUID NOT NULL,
  "businessId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "stateHash" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "encryptedAccessToken" TEXT,
  "assets" JSONB NOT NULL DEFAULT '[]',
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "WhatsappAuthorizationAttempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsappAuthorizationAttempts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WhatsappAuthorizationAttempts_stateHash_key" ON "WhatsappAuthorizationAttempts"("stateHash");
CREATE INDEX "WhatsappAuthorizationAttempts_businessId_userId_sessionId_idx" ON "WhatsappAuthorizationAttempts"("businessId", "userId", "sessionId");
CREATE INDEX "WhatsappAuthorizationAttempts_expiresAt_idx" ON "WhatsappAuthorizationAttempts"("expiresAt");
