import { PaymentStatus, PaymentMethod, PaymentType } from '@prisma/client';

export interface IVehiclePayment {
  id: string;
  shop_id: string;
  vehicle_id: string;
  customer_id: string;
  amount: number;
  paid_amount?: number | null;
  balance_due?: number | null;
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

export { PaymentStatus, PaymentMethod, PaymentType };
