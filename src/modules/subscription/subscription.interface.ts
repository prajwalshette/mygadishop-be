import { SubscriptionPlanName, PlanDuration, SubscriptionStatus } from "@prisma/client";

export interface ISubscriptionPlan {
  id?: string;
  plan_name: SubscriptionPlanName;
  description: string | null;
  is_active: boolean;
  max_vehicles?: number | null;
  max_staff_users: number;
}

export interface ISubscriptionPricing {
  id?: string;
  plan_id: string;
  duration: PlanDuration;
  price: number;
  discount?: number;
  is_active: boolean;
}

export interface ShopSubscription {
  id: string;
  shop_id: string;
  plan_id: string;
  subscription_pricing_id: string;
  start_date: Date;
  end_date: Date;
  status: SubscriptionStatus;
  auto_renew: boolean;
}

export { SubscriptionPlanName, PlanDuration, SubscriptionStatus };