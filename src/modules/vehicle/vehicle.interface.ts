import type { DocumentType, DocumentStatus, VehicleCategory, TwoWheelerType, StartType, AbsType, CarBodyType, DriveType } from '@prisma/client';
import { FuelType, OwnershipType, TransmissionType, VehicleStatus, VehicleType, InsuranceType, VehicleCondition } from '@prisma/client';

/** Stored vehicle document row (API may return `file_url` presigned). */
export interface IVehicleDocument {
  id: string;
  vehicle_id?: string;
  doc_type: DocumentType;
  status: DocumentStatus;
  file_url: string | null;
  expiry_date?: Date | string | null;
  notes?: string | null;
  uploaded_at?: Date | string;
  updated_at?: Date | string;
}

export interface ITwoWheelerDetail {
  id?: string;
  vehicle_id?: string;
  engine_capacity_cc?: number | null;
  max_power_bhp?: number | null;
  max_torque_nm?: number | null;
  top_speed_kmh?: number | null;
  mileage_kmpl?: number | null;
  range_km?: number | null;
  battery_capacity_kwh?: number | null;
  charging_time_hrs?: number | null;
  two_wheeler_type: TwoWheelerType;
  start_type?: StartType | null;
  abs_type?: AbsType | null;
  has_disc_brake?: boolean;
  has_alloy_wheels?: boolean;
  has_bluetooth?: boolean;
}

export interface IFourWheelerDetail {
  id?: string;
  vehicle_id?: string;
  body_type: CarBodyType;
  engine_capacity_cc?: number | null;
  max_power_bhp?: number | null;
  max_torque_nm?: number | null;
  mileage_kmpl?: number | null;
  range_km?: number | null;
  battery_capacity_kwh?: number | null;
  no_of_cylinders?: number | null;
  drive_type?: DriveType | null;
  no_of_doors?: number | null;
  seating_capacity?: number | null;
  boot_space_litres?: number | null;
  no_of_airbags?: number | null;
  has_abs?: boolean;
  has_esp?: boolean;
  ncap_rating?: number | null;
  has_sunroof?: boolean;
  has_cruise_control?: boolean;
  has_android_auto?: boolean;
  has_apple_carplay?: boolean;
  has_360_camera?: boolean;
  has_ventilated_seats?: boolean;
}

export interface IVehicle {
  id: string;
  shop_id?: string;
  seller_customer_id?: string | null;
  buyer_customer_id?: string | null;

  // Identity
  vehicle_category: VehicleCategory;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  variant?: string | null;
  manufacture_year: number;
  registration_year?: number | null;
  color: string;

  // Registration & Compliance
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  registration_valid_till?: Date | string | null;
  insurance_valid_till?: Date | string | null;
  insurance_type?: InsuranceType | null;
  puc_valid_till?: Date | string | null;
  is_hypothecation: boolean;
  hypothecation_bank?: string | null;
  rc_available: boolean;

  // Ownership
  ownership: OwnershipType;
  ownership_city?: string | null;
  ownership_state?: string | null;

  // Odometer & Condition
  odometer_reading: number;
  condition: VehicleCondition;
  accident_history: boolean;
  flood_affected: boolean;
  condition_notes?: string | null;

  // Fuel & Drivetrain
  fuel_type: FuelType;
  transmission: TransmissionType;

  // Pricing
  buying_price?: number | null;
  selling_price?: number | null;
  min_selling_price?: number | null;
  is_price_negotiable: boolean;
  estimated_rto_charges?: number | null;

  // Status & Dates
  status: VehicleStatus;
  buying_date?: Date | string | null;
  selling_date?: Date | string | null;

  // Media
  vehicle_image_urls?: string[];
  inspection_report_url?: string | null;

  // Public Listing
  description?: string | null;
  is_featured: boolean;
  featured_until?: Date | string | null;
  view_count?: number;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;

  // Nested Details
  two_wheeler_detail?: ITwoWheelerDetail | null;
  four_wheeler_detail?: IFourWheelerDetail | null;

  // Relations (mapped for responses)
  vehicle_documents?: IVehicleDocument[];

  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
