import { z } from 'zod';
import { PlatformAdminRole, PlanDuration, ShopBusinessType, SubscriptionPlanName } from '@prisma/client';

// Admin Login Schema
export const AdminLoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_info: z.object({}).passthrough().optional(),
});

// Add Admin Schema
export const addAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(PlatformAdminRole),
});

// Shop Status Update Schema
export const updateShopStatusSchema = z.object({
  status: z.boolean(),
});

// User Status Update Schema
export const updateUserStatusSchema = z.object({
  status: z.boolean(),
});

// ID Param Schemas
export const ShopIdParamSchema = z.object({
  id: z.string().min(1, 'Shop ID is required'),
});

export const UserIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

// Query Schema for get all shops
export const getShopQuerySchema = z.object({
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

  search: z.string().trim().optional(), // Searches: shop_name, email, phone, city

  status: z.enum(['active', 'inactive']).optional(),

  sortBy: z.enum(['created_at', 'updated_at', 'shop_name']).optional().default('created_at'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query Schema for get all users
export const getUserQuerySchema = z.object({
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

  search: z.string().trim().optional(), // Searches: name, email, phone

  status: z.enum(['active', 'inactive']).optional(),

  sortBy: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Create Shop Schema (Admin)
export const createShopSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be at least 6 digits'),
  gstin: z.string().optional(),
  website_url: z.string().url('Invalid URL format').optional(),
  shop_business_type: z
    .enum(Object.values(ShopBusinessType) as [ShopBusinessType, ...ShopBusinessType[]])
    .optional()
    .default(ShopBusinessType.DEALER),
  established_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
});

// Update Shop Status Schema (Enhanced)
export const updateShopStatusEnhancedSchema = z.object({
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  subscription_status: z.enum(['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PAYMENT_PENDING']).optional(),
});

// Shop Vehicles Query Schema
export const getShopVehiclesQuerySchema = z.object({
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
  search: z.string().trim().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Shop Customers Query Schema
export const getShopCustomersQuerySchema = z.object({
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
  search: z.string().trim().optional(),
  customer_type: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Shop Users Query Schema
export const getShopUsersQuerySchema = z.object({
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
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
// Shop Subscription Payment History Query Schema (Transaction model)
export const getShopPaymentHistoryQuerySchema = z.object({
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
  status: z.string().optional(),
  sortBy: z.enum(['created_at', 'payment_date']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Shop Vehicle Payments Query Schema (VehiclePayment model)
export const getShopVehiclePaymentsQuerySchema = z.object({
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
  search: z.string().trim().optional(),
  status: z.string().optional(),
  payment_type: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Enhanced Shop Query Schema
export const getShopQueryEnhancedSchema = z.object({
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
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  subscription_status: z.enum(['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PAYMENT_PENDING']).optional(),
  subscription_plan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'shop_name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Analytics Query Schema
export const getAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(), // ISO date string
  endDate: z.string().datetime().optional(), // ISO date string
  months: z
    .string()
    .optional()
    .default('6')
    .transform(Number)
    .refine(val => val > 0 && val <= 12, 'Months must be between 1 and 12'),
  topShopsLimit: z
    .string()
    .optional()
    .default('5')
    .transform(Number)
    .refine(val => val > 0 && val <= 20, 'Top shops limit must be between 1 and 20'),
});

// Subscription Plan Management Schemas (Admin only)
// Create/Update Subscription Plan Schema
export const createSubscriptionPlanSchema = z.object({
  plan_name: z.enum(SubscriptionPlanName),
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
  duration: z.enum(PlanDuration),
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
export type AdminLoginDto = z.infer<typeof AdminLoginDto>;
export type AddAdminDto = z.infer<typeof addAdminUserSchema>;
export type UpdateShopStatusDto = z.infer<typeof updateShopStatusSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type GetShopQueryDto = z.infer<typeof getShopQuerySchema>;
export type GetUserQueryDto = z.infer<typeof getUserQuerySchema>;
export type CreateShopDto = z.infer<typeof createShopSchema>;
export type UpdateShopStatusEnhancedDto = z.infer<typeof updateShopStatusEnhancedSchema>;
export type GetShopVehiclesQueryDto = z.infer<typeof getShopVehiclesQuerySchema>;
export type GetShopCustomersQueryDto = z.infer<typeof getShopCustomersQuerySchema>;
export type GetShopPaymentHistoryQueryDto = z.infer<typeof getShopPaymentHistoryQuerySchema>;
export type GetShopVehiclePaymentsQueryDto = z.infer<typeof getShopVehiclePaymentsQuerySchema>;
export type GetShopQueryEnhancedDto = z.infer<typeof getShopQueryEnhancedSchema>;
export type GetAnalyticsQueryDto = z.infer<typeof getAnalyticsQuerySchema>;
export type GetShopUsersQueryDto = z.infer<typeof getShopUsersQuerySchema>;
export type CreateSubscriptionPlanDto = z.infer<typeof createSubscriptionPlanSchema>;
export type CreateSubscriptionPricingDto = z.infer<typeof createSubscriptionPricingSchema>;
export type ActiveDeactivePlanDto = z.infer<typeof activeDeactivePlanSchema>;
