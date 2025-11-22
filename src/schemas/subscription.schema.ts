import { z } from 'zod';
import { SubscriptionPlanName, PlanDuration } from '@/interfaces/subscription.interface';

// Create/Update Subscription Plan Schema
export const createSubscriptionPlanSchema = z.object({
  plan_name: z.nativeEnum(SubscriptionPlanName),
  
  description: z.string().min(1, 'Description is required'),
  
  max_vehicles: z.number().int().positive().optional().nullable(),
  
  max_staff_users: z.number().int().positive('Max staff users must be positive'),
});

// Plan ID Param Schema
export const planIdParamSchema = z.object({
  plan_id: z.string().ulid({ message: 'Invalid Plan ID' }),
});

// Create/Update Subscription Pricing Schema
export const createSubscriptionPricingSchema = z.object({
  duration: z.nativeEnum(PlanDuration),
  
  price: z.number().min(0, 'Price must be positive'),
  
  discount: z.number().min(0).max(100, 'Discount must be between 0 and 100').optional().default(0),
});

// Pricing ID Param Schema
export const pricingIdParamSchema = z.object({
  plan_id: z.string().ulid({ message: 'Invalid Plan ID' }),
  subscription_pricing_id: z.string().ulid({ message: 'Invalid Pricing ID' }),
});

// Active/Deactive Plan Schema
export const activeDeactivePlanSchema = z.object({
  is_active: z.boolean(),
});

// Export types
export type CreateSubscriptionPlanDto = z.infer<typeof createSubscriptionPlanSchema>;
export type CreateSubscriptionPricingDto = z.infer<typeof createSubscriptionPricingSchema>;
export type ActiveDeactivePlanDto = z.infer<typeof activeDeactivePlanSchema>;
