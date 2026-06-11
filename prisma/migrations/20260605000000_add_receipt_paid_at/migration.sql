-- AlterTable: add paidAt to receipts for automatic settlement tracking (US-H03b)
ALTER TABLE "receipts" ADD COLUMN "paidAt" TIMESTAMP(3);
