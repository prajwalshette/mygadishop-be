import { CustomerType, Gender } from '@prisma/client';
export interface ICustomer {
  id?: string;
  shop_id?: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  alt_phone?: string | null;
  gender?: Gender | null;
  customer_type?: CustomerType;

  /** Number of completed payments (purchases) - from list API */
  purchasesCount?: number;
  /** Total amount spent (sum of completed payments) - from list API */
  totalSpent?: number;
  /** ISO date string of last purchase - from list API */
  lastPurchaseDate?: string | null;

  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}


export interface ICustomerCsv {
  Name: string;
  Phone: string;
  Email?: string;
  Address?: string;
  Pincode?: string;
  City?: string;
  State?: string;
  Gender?: Gender;
  CustomerType?: CustomerType;
}

export type CustomerProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ICustomerSyncStatus {
  total: number;
  processed: number;
  status: CustomerProcessingStatus;
  error?: string;
}
