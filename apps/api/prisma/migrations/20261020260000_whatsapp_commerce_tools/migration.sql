-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "confirmationJobId" UUID,
ADD COLUMN     "confirmationToken" TEXT,
ADD COLUMN     "deliveryAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryLatitude" DOUBLE PRECISION,
ADD COLUMN     "deliveryLongitude" DOUBLE PRECISION,
ADD COLUMN     "deliveryMode" TEXT NOT NULL DEFAULT 'PICKUP',
ADD COLUMN     "deliveryQuoteStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "deliveryReference" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "threadId" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "storeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WhatsappInboundMessages" ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationLatitude" DOUBLE PRECISION,
ADD COLUMN     "locationLongitude" DOUBLE PRECISION,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "mediaData" BYTEA,
ADD COLUMN     "mediaId" TEXT,
ADD COLUMN     "mediaMimeType" TEXT,
ADD COLUMN     "mediaStartedAt" TIMESTAMPTZ(3),
ADD COLUMN     "mediaStatus" TEXT NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "PaymentProofs" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappToolExecutions" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "callId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappToolExecutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentProofs_businessId_orderId_idx" ON "PaymentProofs"("businessId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProofs_businessId_messageId_key" ON "PaymentProofs"("businessId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappToolExecutions_businessId_jobId_callId_key" ON "WhatsappToolExecutions"("businessId", "jobId", "callId");

-- CreateIndex
CREATE INDEX "Orders_businessId_threadId_createdAt_id_idx" ON "Orders"("businessId", "threadId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappAiReplyJobs_businessId_id_key" ON "WhatsappAiReplyJobs"("businessId", "id");

-- CreateIndex
CREATE INDEX "WhatsappInboundMessages_mediaStatus_receivedAt_idx" ON "WhatsappInboundMessages"("mediaStatus", "receivedAt");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_businessId_threadId_fkey" FOREIGN KEY ("businessId", "threadId") REFERENCES "WhatsappThreads"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProofs" ADD CONSTRAINT "PaymentProofs_businessId_orderId_fkey" FOREIGN KEY ("businessId", "orderId") REFERENCES "Orders"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProofs" ADD CONSTRAINT "PaymentProofs_businessId_threadId_messageId_fkey" FOREIGN KEY ("businessId", "threadId", "messageId") REFERENCES "WhatsappInboundMessages"("businessId", "threadId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappToolExecutions" ADD CONSTRAINT "WhatsappToolExecutions_businessId_jobId_fkey" FOREIGN KEY ("businessId", "jobId") REFERENCES "WhatsappAiReplyJobs"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

