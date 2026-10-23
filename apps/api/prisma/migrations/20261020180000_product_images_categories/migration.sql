BEGIN;

ALTER TABLE "Products" ADD COLUMN "imageUrl" VARCHAR(2048) NOT NULL DEFAULT '';

CREATE TABLE "ProductCategories" (
  "id" UUID NOT NULL,
  "businessId" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ProductCategories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductCategories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProductCategories_businessId_name_key" ON "ProductCategories"("businessId", "name");

-- Preserve existing category names so existing products remain editable.
INSERT INTO "ProductCategories" ("id", "businessId", "name", "updatedAt")
SELECT gen_random_uuid(), "businessId", "category", CURRENT_TIMESTAMP
FROM "Products"
WHERE NOT "isDeleted" AND char_length("category") BETWEEN 2 AND 100
GROUP BY "businessId", "category";

COMMIT;
