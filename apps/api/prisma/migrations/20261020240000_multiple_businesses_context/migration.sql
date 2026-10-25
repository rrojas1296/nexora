-- Explicit deployment only. No database connection is made by build/install.
-- Existing businesses and memberships are retained; legacy Stores are not renamed to Businesses.
ALTER TABLE "Businesses"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PEN',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "contextDraft" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "contextPublished" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "contextVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "contextPublishedAt" TIMESTAMPTZ(3);

-- Existing agent instructions remain in Agents; context starts empty and unpublished.
-- PEN preserves the historical catalog denomination; no amounts are converted.

ALTER TABLE "AuthSessions" ALTER COLUMN "businessId" DROP NOT NULL;
ALTER TABLE "RefreshSessions" ALTER COLUMN "businessId" DROP NOT NULL;
ALTER TABLE "AuthSessions" ADD CONSTRAINT "AuthSessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefreshSessions" DROP CONSTRAINT "RefreshSessions_businessId_userId_familyId_fkey";
ALTER TABLE "RefreshSessions" ADD CONSTRAINT "RefreshSessions_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "AuthSessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Legacy Stores/storeId remain physically intact for a separately reviewed data migration.
-- They are no longer exposed as a module or used for new business configuration.
