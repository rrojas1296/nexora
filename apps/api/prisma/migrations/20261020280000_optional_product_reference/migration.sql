-- An absent reference is NULL; PostgreSQL permits multiple NULLs in the existing
-- business-scoped unique index. Existing references and their uniqueness remain unchanged.
ALTER TABLE "Products" ALTER COLUMN "sku" DROP NOT NULL;
