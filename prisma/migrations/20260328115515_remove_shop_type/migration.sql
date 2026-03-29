/*
  Warnings:

  - You are about to drop the column `shop_type` on the `Shop` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ShopBusinessType" AS ENUM ('DEALER', 'SERVICE', 'DEALER_SERVICE', 'RENTAL', 'MULTI');

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "shop_type";

-- DropEnum
DROP TYPE "ShopType";
