import { SubscriptionPlanName } from "./subscription.interface";
import { SubscriptionStatus } from "./subscription.interface";

export interface IShop {
  id?: string;
  shop_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string | null;

  // Shop Details
  website_url?: string | null;
  shop_logo_url?: string | null;
  shop_type: ShopType;
  established_year?: number | null;

  // Subscription & Status
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlanName | null;
  plan_start_date?: Date | null;
  plan_end_date?: Date | null;
  is_verified: boolean;
  is_active: boolean;
  is_deleted: boolean;
}

export enum ShopType {
  TWO_WHEELER = 'TWO_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  BOTH = 'BOTH',
}