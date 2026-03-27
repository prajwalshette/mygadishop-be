import { ServicingStatus } from '@prisma/client';

export interface IServicing {
  id: string;
  shop_id: string;
  vehicle_id: string;
  customer_id: string;
  service_date: Date;
  service_type: string;
  description?: string;
  parts_replaced?: string[];
  labor_cost: number;
  parts_cost: number;
  other_charges?: number;
  total_cost: number;
  status: ServicingStatus;
  next_service_date?: Date;
  next_service_km?: number;
  technician_name?: string;
  odometer_reading?: number;
  rating?: number;
  customer_feedback?: string;
  service_images?: string[];
}

export { ServicingStatus };
