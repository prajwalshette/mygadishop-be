import type { PaymentMethod, PaymentStatus, ServicingStatus, VehicleType } from '@prisma/client';

export interface IServicing {
  id: string;
  shop_id: string;
  customer_id: string;

  vehicle_brand: string;
  vehicle_model: string;
  vehicle_variant?: string | null;
  vehicle_year?: number | null;
  vehicle_type: VehicleType;
  vehicle_reg_number?: string | null;

  service_date: Date;
  service_type: string;
  description?: string | null;
  parts_replaced: string[];
  labor_cost: number;
  parts_cost: number;
  other_charges: number;
  total_cost: number;

  status: ServicingStatus;
  next_service_date?: Date | null;
  next_service_km?: number | null;
  technician_name?: string | null;
  odometer_reading?: number | null;

  rating?: number | null;
  customer_feedback?: string | null;

  payment_status: PaymentStatus;
  paid_amount: number;
  payment_method?: PaymentMethod | null;
  payment_date?: Date | null;

  service_images: string[];
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
