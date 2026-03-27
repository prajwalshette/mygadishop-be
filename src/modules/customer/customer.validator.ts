import { z } from 'zod';
import { CustomerType, Gender } from './customer.interface';

// Create Customer Schema
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),

  email: z.email('Invalid email address'),

  phone: z.string().min(1, 'Phone number is required'),

  address: z.string().min(1, 'Address is required'),

  city: z.string().optional(),

  state: z.string().optional(),

  pincode: z.string().optional(),

  alt_phone: z.string().optional(),
  gender: z.enum(Gender).optional(),

  customer_type: z.enum(CustomerType),
});

// Update Customer Schema - All fields optional
export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),

  email: z.email().optional(),

  phone: z.string().min(1).optional(),

  address: z.string().min(1).optional(),

  city: z.string().optional(),

  state: z.string().optional(),

  pincode: z.string().optional(),

  alt_phone: z.string().optional(),
  gender: z.enum(Gender).optional(),

  customer_type: z.enum(CustomerType).optional(),
});

// Customer ID Param Schema
export const customerIdParamSchema = z.object({
  id: z.ulid({ message: 'Invalid Customer Id' }),
});

// Query Schema for get all customers
export const getCustomerQuerySchema = z.object({
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

  customer_type: z.enum(CustomerType).optional(),

  last_purchase: z.enum(['all_time', 'this_month', 'last_3_months']).optional().default('all_time'),

  sortBy: z.enum(['created_at', 'updated_at', 'name', 'total_spent', 'last_purchase']).optional().default('created_at'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query Schema for export customers (no pagination)
export const exportCustomerQuerySchema = z.object({
  search: z.string().trim().optional(), // Searches: name, email, phone

  customer_type: z.enum(CustomerType).optional(),

  last_purchase: z.enum(['all_time', 'this_month', 'last_3_months']).optional().default('all_time'),

  sortBy: z.enum(['created_at', 'updated_at', 'name', 'total_spent', 'last_purchase']).optional().default('created_at'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Export types
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type GetCustomerQueryDto = z.infer<typeof getCustomerQuerySchema>;
export type ExportCustomerQueryDto = z.infer<typeof exportCustomerQuerySchema>;
