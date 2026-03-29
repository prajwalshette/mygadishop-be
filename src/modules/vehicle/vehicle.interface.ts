import type { DocumentType, DocumentStatus } from '@prisma/client';
import { FuelType, OwnershipType, TransmissionType, VehicleStatus, VehicleType } from '@prisma/client';

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

export interface IVehicle {
  id: string;
  shop_id?: string;
  customer_id?: string;
  type: VehicleType;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  color: string;
  mileage: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  engine_capacity?: number;
  ownership: OwnershipType;
  insurance_valid_till?: Date | string | null;
  registration_valid_till?: Date | string | null;
  puc_valid_till?: Date | string | null;
  buying_price?: number;
  selling_price?: number;
  min_selling_price?: number;
  is_price_negotiable?: boolean;
  vehicle_image_urls?: string[];
  /** Typed documents (replaces flat `vehicle_doc_urls`). */
  vehicle_documents?: IVehicleDocument[];
  status: VehicleStatus;
  buying_date?: Date | string | null;
  selling_date?: Date | string | null;
  features?: string[];
  description?: string;
  is_featured?: boolean;
  featured_until?: Date | string | null;
  view_count?: number;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
