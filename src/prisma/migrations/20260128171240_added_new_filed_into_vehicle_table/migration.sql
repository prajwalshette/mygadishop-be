/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_price_negotiable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "meta_description" TEXT,
ADD COLUMN     "meta_title" TEXT,
ADD COLUMN     "min_selling_price" DOUBLE PRECISION,
ADD COLUMN     "puc_valid_till" TIMESTAMP(3),
ADD COLUMN     "registration_valid_till" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");
