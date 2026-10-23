BEGIN;

CREATE TABLE "ProductImages" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProductImages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductImages_data_size" CHECK (octet_length("data") BETWEEN 1 AND 2097152)
);
CREATE INDEX "ProductImages_businessId_isDeleted_idx" ON "ProductImages"("businessId", "isDeleted");
ALTER TABLE "ProductImages" ADD CONSTRAINT "ProductImages_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
