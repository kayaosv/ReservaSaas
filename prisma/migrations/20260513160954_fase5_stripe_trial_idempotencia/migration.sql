-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "trialExpiredSentAt" TIMESTAMP(3),
ADD COLUMN     "trialReminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProcessedStripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);
