-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "InquiryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('BUYING', 'SELLING', 'SERVICE', 'GENERAL');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('WALK_IN', 'PHONE_CALL', 'WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'REFERRAL', 'OLX', 'OTHER');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "assigned_to" TEXT,
    "inquiry_type" "InquiryType" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "priority" "InquiryPriority" NOT NULL DEFAULT 'MEDIUM',
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "vehicle_type" "VehicleType",
    "budget_min" DOUBLE PRECISION,
    "budget_max" DOUBLE PRECISION,
    "preferred_brands" TEXT[],
    "message" TEXT,
    "requirements" JSONB,
    "source" "InquirySource" NOT NULL DEFAULT 'WALK_IN',
    "referred_by" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "follow_up_notes" TEXT,
    "converted_at" TIMESTAMP(3),
    "conversion_value" DOUBLE PRECISION,
    "closed_at" TIMESTAMP(3),
    "closure_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryNote" (
    "id" TEXT NOT NULL,
    "inquiry_id" TEXT NOT NULL,
    "user_id" TEXT,
    "note" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_shop_id_status_idx" ON "Inquiry"("shop_id", "status");

-- CreateIndex
CREATE INDEX "Inquiry_shop_id_inquiry_type_idx" ON "Inquiry"("shop_id", "inquiry_type");

-- CreateIndex
CREATE INDEX "Inquiry_shop_id_assigned_to_idx" ON "Inquiry"("shop_id", "assigned_to");

-- CreateIndex
CREATE INDEX "Inquiry_created_at_idx" ON "Inquiry"("created_at");

-- CreateIndex
CREATE INDEX "InquiryNote_inquiry_id_created_at_idx" ON "InquiryNote"("inquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "VehiclePayment_shop_id_payment_date_idx" ON "VehiclePayment"("shop_id", "payment_date");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryNote" ADD CONSTRAINT "InquiryNote_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
