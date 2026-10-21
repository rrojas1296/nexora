-- Requires the initial migration. Apply explicitly during a coordinated API deployment.
-- Rename in place: preserve rows, foreign keys, unique keys and referential actions.
BEGIN;

ALTER TABLE "Agent" RENAME TO "Agents";
ALTER TABLE "User" RENAME TO "Users";
ALTER TABLE "Membership" RENAME TO "Memberships";
ALTER TABLE "AuthSession" RENAME TO "AuthSessions";
ALTER TABLE "RefreshSession" RENAME TO "RefreshSessions";
ALTER TABLE "Business" RENAME TO "Businesses";
ALTER TABLE "Client" RENAME TO "Clients";
ALTER TABLE "Conversation" RENAME TO "Conversations";
ALTER TABLE "Message" RENAME TO "Messages";
ALTER TABLE "Order" RENAME TO "Orders";
ALTER TABLE "OrderItem" RENAME TO "OrderItems";
ALTER TABLE "Product" RENAME TO "Products";
ALTER TABLE "Store" RENAME TO "Stores";

-- Existing rows remain visible. A deleted row retains all its unique identifiers.
ALTER TABLE "Agents" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Users" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Memberships" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AuthSessions" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RefreshSessions" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Businesses" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Clients" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversations" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Messages" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Orders" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderItems" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Products" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stores" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- Match Prisma's default constraint/index names for the mapped plural table names.
-- Renaming a primary key constraint also renames its backing index in PostgreSQL.
ALTER TABLE "Agents" RENAME CONSTRAINT "Agent_pkey" TO "Agents_pkey";
ALTER TABLE "Users" RENAME CONSTRAINT "User_pkey" TO "Users_pkey";
ALTER TABLE "Memberships" RENAME CONSTRAINT "Membership_pkey" TO "Memberships_pkey";
ALTER TABLE "AuthSessions" RENAME CONSTRAINT "AuthSession_pkey" TO "AuthSessions_pkey";
ALTER TABLE "RefreshSessions" RENAME CONSTRAINT "RefreshSession_pkey" TO "RefreshSessions_pkey";
ALTER TABLE "Businesses" RENAME CONSTRAINT "Business_pkey" TO "Businesses_pkey";
ALTER TABLE "Clients" RENAME CONSTRAINT "Client_pkey" TO "Clients_pkey";
ALTER TABLE "Conversations" RENAME CONSTRAINT "Conversation_pkey" TO "Conversations_pkey";
ALTER TABLE "Messages" RENAME CONSTRAINT "Message_pkey" TO "Messages_pkey";
ALTER TABLE "Orders" RENAME CONSTRAINT "Order_pkey" TO "Orders_pkey";
ALTER TABLE "OrderItems" RENAME CONSTRAINT "OrderItem_pkey" TO "OrderItems_pkey";
ALTER TABLE "Products" RENAME CONSTRAINT "Product_pkey" TO "Products_pkey";
ALTER TABLE "Stores" RENAME CONSTRAINT "Store_pkey" TO "Stores_pkey";

ALTER INDEX "Agent_businessId_id_key" RENAME TO "Agents_businessId_id_key";
ALTER INDEX "Agent_businessId_storeId_key" RENAME TO "Agents_businessId_storeId_key";
ALTER INDEX "User_email_key" RENAME TO "Users_email_key";
ALTER INDEX "Membership_userId_idx" RENAME TO "Memberships_userId_idx";
ALTER INDEX "AuthSession_userId_revokedAt_idx" RENAME TO "AuthSessions_userId_revokedAt_idx";
ALTER INDEX "AuthSession_expiresAt_idx" RENAME TO "AuthSessions_expiresAt_idx";
ALTER INDEX "AuthSession_businessId_userId_id_key" RENAME TO "AuthSessions_businessId_userId_id_key";
ALTER INDEX "RefreshSession_refreshTokenHash_key" RENAME TO "RefreshSessions_refreshTokenHash_key";
ALTER INDEX "RefreshSession_businessId_userId_idx" RENAME TO "RefreshSessions_businessId_userId_idx";
ALTER INDEX "RefreshSession_businessId_familyId_idx" RENAME TO "RefreshSessions_businessId_familyId_idx";
ALTER INDEX "RefreshSession_expiresAt_idx" RENAME TO "RefreshSessions_expiresAt_idx";
ALTER INDEX "Business_slug_key" RENAME TO "Businesses_slug_key";
ALTER INDEX "Client_businessId_phone_idx" RENAME TO "Clients_businessId_phone_idx";
ALTER INDEX "Client_businessId_id_key" RENAME TO "Clients_businessId_id_key";
ALTER INDEX "Client_businessId_email_key" RENAME TO "Clients_businessId_email_key";
ALTER INDEX "Conversation_businessId_status_updatedAt_idx" RENAME TO "Conversations_businessId_status_updatedAt_idx";
ALTER INDEX "Conversation_businessId_clientId_idx" RENAME TO "Conversations_businessId_clientId_idx";
ALTER INDEX "Conversation_businessId_storeId_idx" RENAME TO "Conversations_businessId_storeId_idx";
ALTER INDEX "Conversation_businessId_assigneeUserId_idx" RENAME TO "Conversations_businessId_assigneeUserId_idx";
ALTER INDEX "Conversation_businessId_id_key" RENAME TO "Conversations_businessId_id_key";
ALTER INDEX "Message_businessId_conversationId_createdAt_idx" RENAME TO "Messages_businessId_conversationId_createdAt_idx";
ALTER INDEX "Message_businessId_id_key" RENAME TO "Messages_businessId_id_key";
ALTER INDEX "Order_businessId_placedAt_idx" RENAME TO "Orders_businessId_placedAt_idx";
ALTER INDEX "Order_businessId_status_idx" RENAME TO "Orders_businessId_status_idx";
ALTER INDEX "Order_businessId_clientId_idx" RENAME TO "Orders_businessId_clientId_idx";
ALTER INDEX "Order_businessId_storeId_idx" RENAME TO "Orders_businessId_storeId_idx";
ALTER INDEX "Order_businessId_id_key" RENAME TO "Orders_businessId_id_key";
ALTER INDEX "Order_businessId_reference_key" RENAME TO "Orders_businessId_reference_key";
ALTER INDEX "OrderItem_businessId_orderId_idx" RENAME TO "OrderItems_businessId_orderId_idx";
ALTER INDEX "OrderItem_businessId_productId_idx" RENAME TO "OrderItems_businessId_productId_idx";
ALTER INDEX "OrderItem_businessId_id_key" RENAME TO "OrderItems_businessId_id_key";
ALTER INDEX "Product_businessId_active_idx" RENAME TO "Products_businessId_active_idx";
ALTER INDEX "Product_businessId_id_key" RENAME TO "Products_businessId_id_key";
ALTER INDEX "Product_businessId_sku_key" RENAME TO "Products_businessId_sku_key";
ALTER INDEX "Store_businessId_active_idx" RENAME TO "Stores_businessId_active_idx";
ALTER INDEX "Store_businessId_id_key" RENAME TO "Stores_businessId_id_key";

ALTER TABLE "Agents" RENAME CONSTRAINT "Agent_businessId_fkey" TO "Agents_businessId_fkey";
ALTER TABLE "Agents" RENAME CONSTRAINT "Agent_businessId_storeId_fkey" TO "Agents_businessId_storeId_fkey";
ALTER TABLE "Memberships" RENAME CONSTRAINT "Membership_businessId_fkey" TO "Memberships_businessId_fkey";
ALTER TABLE "Memberships" RENAME CONSTRAINT "Membership_userId_fkey" TO "Memberships_userId_fkey";
ALTER TABLE "AuthSessions" RENAME CONSTRAINT "AuthSession_businessId_userId_fkey" TO "AuthSessions_businessId_userId_fkey";
ALTER TABLE "RefreshSessions" RENAME CONSTRAINT "RefreshSession_businessId_userId_fkey" TO "RefreshSessions_businessId_userId_fkey";
ALTER TABLE "RefreshSessions" RENAME CONSTRAINT "RefreshSession_businessId_userId_familyId_fkey" TO "RefreshSessions_businessId_userId_familyId_fkey";
ALTER TABLE "Clients" RENAME CONSTRAINT "Client_businessId_fkey" TO "Clients_businessId_fkey";
ALTER TABLE "Conversations" RENAME CONSTRAINT "Conversation_businessId_fkey" TO "Conversations_businessId_fkey";
ALTER TABLE "Conversations" RENAME CONSTRAINT "Conversation_businessId_clientId_fkey" TO "Conversations_businessId_clientId_fkey";
ALTER TABLE "Conversations" RENAME CONSTRAINT "Conversation_businessId_storeId_fkey" TO "Conversations_businessId_storeId_fkey";
ALTER TABLE "Conversations" RENAME CONSTRAINT "Conversation_businessId_assigneeUserId_fkey" TO "Conversations_businessId_assigneeUserId_fkey";
ALTER TABLE "Messages" RENAME CONSTRAINT "Message_businessId_fkey" TO "Messages_businessId_fkey";
ALTER TABLE "Messages" RENAME CONSTRAINT "Message_businessId_conversationId_fkey" TO "Messages_businessId_conversationId_fkey";
ALTER TABLE "Orders" RENAME CONSTRAINT "Order_businessId_fkey" TO "Orders_businessId_fkey";
ALTER TABLE "Orders" RENAME CONSTRAINT "Order_businessId_clientId_fkey" TO "Orders_businessId_clientId_fkey";
ALTER TABLE "Orders" RENAME CONSTRAINT "Order_businessId_storeId_fkey" TO "Orders_businessId_storeId_fkey";
ALTER TABLE "OrderItems" RENAME CONSTRAINT "OrderItem_businessId_fkey" TO "OrderItems_businessId_fkey";
ALTER TABLE "OrderItems" RENAME CONSTRAINT "OrderItem_businessId_orderId_fkey" TO "OrderItems_businessId_orderId_fkey";
ALTER TABLE "OrderItems" RENAME CONSTRAINT "OrderItem_businessId_productId_fkey" TO "OrderItems_businessId_productId_fkey";
ALTER TABLE "Products" RENAME CONSTRAINT "Product_businessId_fkey" TO "Products_businessId_fkey";
ALTER TABLE "Stores" RENAME CONSTRAINT "Store_businessId_fkey" TO "Stores_businessId_fkey";

COMMIT;
