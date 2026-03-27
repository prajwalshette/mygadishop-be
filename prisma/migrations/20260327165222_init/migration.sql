-- CreateEnum
CREATE TYPE "PlatformAdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ShopUserRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ShopType" AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER', 'THREE_WHEELER', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('PENDING', 'CLEARED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "SubscriptionPlanName" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('BUYER', 'SELLER', 'BOTH', 'SERVICE_ONLY');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'SCOOTER', 'MOPED', 'ELECTRIC_SCOOTER', 'ELECTRIC_BIKE', 'CAR', 'AUTO_RICKSHAW', 'E_RICKSHAW', 'GOODS_AUTO', 'PICKUP_TRUCK', 'MINI_TRUCK', 'MEDIUM_TRUCK', 'HEAVY_TRUCK', 'BUS', 'TEMPO');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FOURTH_PLUS');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'SOLD', 'MAINTENANCE', 'BOOKED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ServicingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING', 'WAITING_PARTS', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE', 'EMI');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('VEHICLE_SALE', 'VEHICLE_PURCHASE', 'SERVICE', 'ADVANCE', 'REFUND');

-- CreateEnum
CREATE TYPE "PlanDuration" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PAYMENT_PENDING');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "InquiryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('BUYING', 'SELLING', 'SERVICE', 'GENERAL');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('WALK_IN', 'PHONE_CALL', 'WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'REFERRAL', 'OLX', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "TwoWheelerType" AS ENUM ('BIKE', 'SCOOTER', 'MOPED', 'ELECTRIC_SCOOTER', 'ELECTRIC_BIKE');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('COMPREHENSIVE', 'THIRD_PARTY', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StartType" AS ENUM ('KICK', 'SELF', 'BOTH');

-- CreateEnum
CREATE TYPE "AbsType" AS ENUM ('NO_ABS', 'SINGLE_CHANNEL', 'DUAL_CHANNEL');

-- CreateEnum
CREATE TYPE "DriveType" AS ENUM ('FWD', 'RWD', 'AWD', 'FOUR_WD');

-- CreateEnum
CREATE TYPE "CarBodyType" AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'CROSSOVER', 'CONVERTIBLE', 'COUPE', 'PICKUP');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RC_BOOK', 'INSURANCE', 'PUC', 'SERVICE_INVOICE', 'NOC', 'FORM_26', 'HYPOTHECATION_NOC', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('AVAILABLE', 'MISSING', 'EXPIRED', 'EXPIRING_SOON');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SHOP_USER', 'PUBLIC_USER', 'ADMIN_USER');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('PAINT_WORK', 'TYRE_REPLACEMENT', 'BATTERY', 'ENGINE_REPAIR', 'ELECTRICAL', 'BODY_REPAIR', 'CLEANING_POLISH', 'REGISTRATION', 'INSURANCE', 'INSPECTION', 'LABOUR', 'SPARE_PARTS', 'OTHER');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "PlatformAdminRole" NOT NULL,
    "password" TEXT NOT NULL,
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "ShopUserRole" NOT NULL DEFAULT 'STAFF',
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "gstin" TEXT,
    "website_url" TEXT,
    "shop_logo_url" TEXT,
    "shop_type" "ShopType" NOT NULL DEFAULT 'TWO_WHEELER',
    "established_year" INTEGER,
    "description" TEXT,
    "business_hours" JSONB,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "twitter_url" TEXT,
    "youtube_url" TEXT,
    "whatsapp_number" TEXT,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscription_plan" "SubscriptionPlanName",
    "plan_start_date" TIMESTAMP(3),
    "plan_end_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_vehicles" INTEGER,
    "max_staff_users" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPricing" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "duration" "PlanDuration" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSubscription" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "subscription_pricing_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "receipt_number" TEXT,
    "invoice_url" TEXT,
    "description" TEXT,
    "notes" JSONB,
    "failure_reason" TEXT,
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "alt_phone" TEXT,
    "gender" "Gender",
    "customer_type" "CustomerType" NOT NULL DEFAULT 'BUYER',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "seller_customer_id" TEXT,
    "buyer_customer_id" TEXT,
    "vehicle_category" "VehicleCategory" NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "manufacture_year" INTEGER NOT NULL,
    "registration_year" INTEGER,
    "color" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "chassis_number" TEXT NOT NULL,
    "engine_number" TEXT NOT NULL,
    "registration_valid_till" TIMESTAMP(3),
    "insurance_valid_till" TIMESTAMP(3),
    "insurance_type" "InsuranceType",
    "puc_valid_till" TIMESTAMP(3),
    "is_hypothecation" BOOLEAN NOT NULL DEFAULT false,
    "hypothecation_bank" TEXT,
    "rc_available" BOOLEAN NOT NULL DEFAULT true,
    "ownership" "OwnershipType" NOT NULL DEFAULT 'FIRST',
    "ownership_city" TEXT,
    "ownership_state" TEXT,
    "odometer_reading" INTEGER NOT NULL,
    "condition" "VehicleCondition" NOT NULL,
    "accident_history" BOOLEAN NOT NULL DEFAULT false,
    "flood_affected" BOOLEAN NOT NULL DEFAULT false,
    "condition_notes" TEXT,
    "fuel_type" "FuelType" NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "buying_price" DOUBLE PRECISION,
    "selling_price" DOUBLE PRECISION,
    "min_selling_price" DOUBLE PRECISION,
    "is_price_negotiable" BOOLEAN NOT NULL DEFAULT true,
    "estimated_rto_charges" DOUBLE PRECISION,
    "status" "VehicleStatus" NOT NULL,
    "buying_date" TIMESTAMP(3),
    "selling_date" TIMESTAMP(3),
    "vehicle_image_urls" TEXT[],
    "vehicle_doc_urls" TEXT[],
    "inspection_report_url" TEXT,
    "features" TEXT[],
    "description" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_until" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoWheelerDetail" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "engine_capacity_cc" INTEGER,
    "max_power_bhp" DOUBLE PRECISION,
    "max_torque_nm" DOUBLE PRECISION,
    "top_speed_kmh" INTEGER,
    "mileage_kmpl" DOUBLE PRECISION,
    "range_km" DOUBLE PRECISION,
    "battery_capacity_kwh" DOUBLE PRECISION,
    "charging_time_hrs" DOUBLE PRECISION,
    "two_wheeler_type" "TwoWheelerType" NOT NULL,
    "start_type" "StartType",
    "abs_type" "AbsType",
    "has_disc_brake" BOOLEAN NOT NULL DEFAULT false,
    "has_alloy_wheels" BOOLEAN NOT NULL DEFAULT false,
    "has_bluetooth" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TwoWheelerDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FourWheelerDetail" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "body_type" "CarBodyType" NOT NULL,
    "engine_capacity_cc" INTEGER,
    "max_power_bhp" DOUBLE PRECISION,
    "max_torque_nm" DOUBLE PRECISION,
    "mileage_kmpl" DOUBLE PRECISION,
    "range_km" DOUBLE PRECISION,
    "battery_capacity_kwh" DOUBLE PRECISION,
    "no_of_cylinders" INTEGER,
    "drive_type" "DriveType",
    "no_of_doors" INTEGER,
    "seating_capacity" INTEGER,
    "boot_space_litres" INTEGER,
    "no_of_airbags" INTEGER,
    "has_abs" BOOLEAN NOT NULL DEFAULT false,
    "has_esp" BOOLEAN NOT NULL DEFAULT false,
    "ncap_rating" INTEGER,
    "has_sunroof" BOOLEAN NOT NULL DEFAULT false,
    "has_cruise_control" BOOLEAN NOT NULL DEFAULT false,
    "has_android_auto" BOOLEAN NOT NULL DEFAULT false,
    "has_apple_carplay" BOOLEAN NOT NULL DEFAULT false,
    "has_360_camera" BOOLEAN NOT NULL DEFAULT false,
    "has_ventilated_seats" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FourWheelerDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "file_url" TEXT,
    "expiry_date" TIMESTAMP(3),
    "notes" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleExpense" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendor_name" TEXT,
    "receipt_url" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicing" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_brand" TEXT NOT NULL,
    "vehicle_model" TEXT NOT NULL,
    "vehicle_variant" TEXT,
    "vehicle_year" INTEGER,
    "vehicle_type" "VehicleType" NOT NULL,
    "vehicle_reg_number" TEXT,
    "service_date" TIMESTAMP(3) NOT NULL,
    "service_type" TEXT NOT NULL,
    "description" TEXT,
    "parts_replaced" TEXT[],
    "labor_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parts_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "status" "ServicingStatus" NOT NULL,
    "next_service_date" TIMESTAMP(3),
    "next_service_km" INTEGER,
    "technician_name" TEXT,
    "odometer_reading" INTEGER,
    "rating" INTEGER,
    "customer_feedback" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_method" "PaymentMethod",
    "payment_date" TIMESTAMP(3),
    "service_images" TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePayment" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION,
    "balance_due" DOUBLE PRECISION,
    "payment_type" "PaymentType" NOT NULL DEFAULT 'VEHICLE_SALE',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cheque_number" TEXT,
    "cheque_date" TIMESTAMP(3),
    "bank_name" TEXT,
    "cheque_status" "ChequeStatus",
    "transaction_id" TEXT,
    "payment_receipt_images" TEXT[],
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePayment_pkey" PRIMARY KEY ("id")
);

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
    "follow_up_notes" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" "UserType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "user_type" "UserType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_info" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_phone_key" ON "Admin"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_shop_id_role_idx" ON "User"("shop_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_shop_id_email_key" ON "User"("shop_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_email_key" ON "Shop"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_phone_key" ON "Shop"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_gstin_key" ON "Shop"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_plan_name_key" ON "SubscriptionPlan"("plan_name");

-- CreateIndex
CREATE INDEX "SubscriptionPricing_plan_id_idx" ON "SubscriptionPricing"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPricing_plan_id_duration_key" ON "SubscriptionPricing"("plan_id", "duration");

-- CreateIndex
CREATE INDEX "ShopSubscription_shop_id_status_idx" ON "ShopSubscription"("shop_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_razorpay_order_id_key" ON "Transaction"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_razorpay_payment_id_key" ON "Transaction"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receipt_number_key" ON "Transaction"("receipt_number");

-- CreateIndex
CREATE INDEX "Transaction_shop_id_status_idx" ON "Transaction"("shop_id", "status");

-- CreateIndex
CREATE INDEX "Transaction_razorpay_order_id_idx" ON "Transaction"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "Customer_shop_id_customer_type_idx" ON "Customer"("shop_id", "customer_type");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_shop_id_phone_key" ON "Customer"("shop_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE INDEX "Vehicle_shop_id_status_idx" ON "Vehicle"("shop_id", "status");

-- CreateIndex
CREATE INDEX "Vehicle_shop_id_vehicle_category_idx" ON "Vehicle"("shop_id", "vehicle_category");

-- CreateIndex
CREATE INDEX "Vehicle_shop_id_vehicle_type_idx" ON "Vehicle"("shop_id", "vehicle_type");

-- CreateIndex
CREATE INDEX "Vehicle_shop_id_seller_customer_id_idx" ON "Vehicle"("shop_id", "seller_customer_id");

-- CreateIndex
CREATE INDEX "Vehicle_shop_id_buyer_customer_id_idx" ON "Vehicle"("shop_id", "buyer_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_shop_id_registration_number_key" ON "Vehicle"("shop_id", "registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_shop_id_chassis_number_key" ON "Vehicle"("shop_id", "chassis_number");

-- CreateIndex
CREATE UNIQUE INDEX "TwoWheelerDetail_vehicle_id_key" ON "TwoWheelerDetail"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "FourWheelerDetail_vehicle_id_key" ON "FourWheelerDetail"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_documents_vehicle_id_doc_type_key" ON "vehicle_documents"("vehicle_id", "doc_type");

-- CreateIndex
CREATE INDEX "VehicleExpense_vehicle_id_idx" ON "VehicleExpense"("vehicle_id");

-- CreateIndex
CREATE INDEX "VehicleExpense_shop_id_expense_date_idx" ON "VehicleExpense"("shop_id", "expense_date");

-- CreateIndex
CREATE INDEX "Servicing_shop_id_status_idx" ON "Servicing"("shop_id", "status");

-- CreateIndex
CREATE INDEX "Servicing_shop_id_customer_id_idx" ON "Servicing"("shop_id", "customer_id");

-- CreateIndex
CREATE INDEX "VehiclePayment_shop_id_status_idx" ON "VehiclePayment"("shop_id", "status");

-- CreateIndex
CREATE INDEX "VehiclePayment_shop_id_vehicle_id_idx" ON "VehiclePayment"("shop_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "VehiclePayment_shop_id_customer_id_idx" ON "VehiclePayment"("shop_id", "customer_id");

-- CreateIndex
CREATE INDEX "VehiclePayment_shop_id_payment_date_idx" ON "VehiclePayment"("shop_id", "payment_date");

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
CREATE INDEX "NotificationLog_user_id_user_type_idx" ON "NotificationLog"("user_id", "user_type");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_user_id_user_type_idx" ON "DeviceToken"("user_id", "user_type");

-- CreateIndex
CREATE INDEX "DeviceToken_is_active_idx" ON "DeviceToken"("is_active");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPricing" ADD CONSTRAINT "SubscriptionPricing_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_subscription_pricing_id_fkey" FOREIGN KEY ("subscription_pricing_id") REFERENCES "SubscriptionPricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "ShopSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_seller_customer_id_fkey" FOREIGN KEY ("seller_customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_buyer_customer_id_fkey" FOREIGN KEY ("buyer_customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoWheelerDetail" ADD CONSTRAINT "TwoWheelerDetail_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FourWheelerDetail" ADD CONSTRAINT "FourWheelerDetail_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicing" ADD CONSTRAINT "Servicing_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicing" ADD CONSTRAINT "Servicing_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePayment" ADD CONSTRAINT "VehiclePayment_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePayment" ADD CONSTRAINT "VehiclePayment_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePayment" ADD CONSTRAINT "VehiclePayment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
