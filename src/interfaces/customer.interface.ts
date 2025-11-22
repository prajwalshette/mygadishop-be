export interface ICustomer {
  id?: string;
  shop_id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  customer_type?: CustomerType;
  is_verified: boolean;
  is_active: boolean;
  deleted_at?: Date | null;
}

export enum CustomerType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BOTH =  'BOTH',
}