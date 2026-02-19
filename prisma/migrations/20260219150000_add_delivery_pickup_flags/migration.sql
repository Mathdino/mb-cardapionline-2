-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "allowsDelivery" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN     "allowsPickup" BOOLEAN NOT NULL DEFAULT true;
