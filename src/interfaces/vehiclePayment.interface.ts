
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


export interface IVehiclePayment {
  id: string;
  vehicle_id: string;
  customer_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  payment_receipt_images: string[];
  message?: string;
  created_at: Date;
  updated_at: Date;
}
