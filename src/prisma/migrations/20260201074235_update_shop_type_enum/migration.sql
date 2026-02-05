/*
  Warnings:

  - The values [BOTH] on the enum `ShopType` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `follow_up_notes` on table `Inquiry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShopType_new" AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER', 'THREE_WHEELER', 'COMMERCIAL');
ALTER TABLE "public"."Shop" ALTER COLUMN "shop_type" DROP DEFAULT;
ALTER TABLE "Shop" ALTER COLUMN "shop_type" TYPE "ShopType_new" USING ("shop_type"::text::"ShopType_new");
ALTER TYPE "ShopType" RENAME TO "ShopType_old";
ALTER TYPE "ShopType_new" RENAME TO "ShopType";
DROP TYPE "public"."ShopType_old";
ALTER TABLE "Shop" ALTER COLUMN "shop_type" SET DEFAULT 'TWO_WHEELER';
COMMIT;

-- AlterTable
ALTER TABLE "Inquiry" ALTER COLUMN "follow_up_notes" SET NOT NULL;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "shop_type" SET DEFAULT 'TWO_WHEELER';
