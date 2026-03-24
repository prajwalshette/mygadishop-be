/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `Servicing` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `VehiclePayment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Servicing" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VehiclePayment" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_subscription_pricing_id_fkey" FOREIGN KEY ("subscription_pricing_id") REFERENCES "SubscriptionPricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
