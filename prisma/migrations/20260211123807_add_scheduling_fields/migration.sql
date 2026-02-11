-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "scheduledPickupTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "preparationTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preparationTimeUnit" TEXT NOT NULL DEFAULT 'hours';
