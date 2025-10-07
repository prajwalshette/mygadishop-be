
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
  is_deleted?: boolean;
}

export enum CustomerType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BOTH =  'BOTH',
}