
export enum ServicingStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}


export interface IServicing {
  id: string;
  vehicle_id: string;
  customer_id: string;
  service_date: Date;
  service_type: string;
  description?: string;
  cost: number;
  status: ServicingStatus;
  next_service_date?: Date;
}
