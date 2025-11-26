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

// Shop ID Param Schema
export const shopIdParamSchema = z.object({
  shop_id: z.string().ulid({ message: 'Invalid Shop ID' }),
});

// Get Subscription History Query Schema
export const getSubscriptionHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine(val => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
});

// Get Payment History Query Schema
export const getPaymentHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine(val => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
});

// Export types
export type CreateSubscriptionPlanDto = z.infer<typeof createSubscriptionPlanSchema>;
export type CreateSubscriptionPricingDto = z.infer<typeof createSubscriptionPricingSchema>;
export type ActiveDeactivePlanDto = z.infer<typeof activeDeactivePlanSchema>;
export type GetSubscriptionHistoryQueryDto = z.infer<typeof getSubscriptionHistoryQuerySchema>;
export type GetPaymentHistoryQueryDto = z.infer<typeof getPaymentHistoryQuerySchema>;
