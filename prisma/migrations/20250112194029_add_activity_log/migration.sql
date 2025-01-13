/*
  Warnings:

  - Changed the type of `status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('created', 'in_progress', 'delivered', 'invoiced');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityStage" AS ENUM ('QUEUE_INITIATED', 'PDF_GENERATION', 'FILE_STORING', 'NOTIFICATION', 'EMAIL_INITIATED', 'EMAIL_SENT', 'COMPLETED');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "status" "ActivityStatus" NOT NULL,
    "stage" "ActivityStage" NOT NULL,
    "initiatedBy" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "processorId" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "metadata" JSONB,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_orderId_idx" ON "activity_logs"("orderId");

-- CreateIndex
CREATE INDEX "activity_logs_status_idx" ON "activity_logs"("status");

-- CreateIndex
CREATE INDEX "activity_logs_stage_idx" ON "activity_logs"("stage");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
