
export enum PaymentStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  UPI = "UPI",
  CARD = "CARD",
  NET_BANKING = "NET_BANKING",
  EMI = "EMI",
}

export enum PaymentType {
  VEHICLE_SALE = "VEHICLE_SALE",
  VEHICLE_PURCHASE = "VEHICLE_PURCHASE",
  SERVICE = "SERVICE",
  ADVANCE = "ADVANCE",
  REFUND = "REFUND",
}

export interface IVehiclePayment {
  id: string;
  shop_id: string;
  vehicle_id: string;
  customer_id: string;
  amount: number;
  payment_type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  payment_receipt_images: string[];
  notes?: string;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
