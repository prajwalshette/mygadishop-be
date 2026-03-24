-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('PENDING', 'CLEARED', 'BOUNCED');

-- AlterTable
ALTER TABLE "Servicing" ADD COLUMN     "customer_feedback" TEXT,
ADD COLUMN     "next_service_km" INTEGER,
ADD COLUMN     "odometer_reading" INTEGER,
ADD COLUMN     "other_charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "VehiclePayment" ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "cheque_date" TIMESTAMP(3),
ADD COLUMN     "cheque_number" TEXT,
ADD COLUMN     "cheque_status" "ChequeStatus",
ADD COLUMN     "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
