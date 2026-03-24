-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "alt_phone" TEXT,
ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "business_hours" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "facebook_url" TEXT,
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "trial_ends_at" TIMESTAMP(3),
ADD COLUMN     "twitter_url" TEXT,
ADD COLUMN     "whatsapp_number" TEXT,
ADD COLUMN     "youtube_url" TEXT;
