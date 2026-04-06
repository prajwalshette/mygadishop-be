import { z } from 'zod';
import { CustomerType, Gender } from '@prisma/client';

// Create Customer Schema
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),

  email: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
    z.email('Invalid email address').optional(),
  ),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  address: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().optional(),
  ),

  city: z.string().optional(),

  state: z.string().optional(),

  pincode: z.string().optional(),

  alt_phone: z
    .string()
    .optional()
    .refine(val => val === undefined || val === '' || /^[6-9]\d{9}$/.test(val), {
      message: 'Enter a valid 10-digit Indian mobile number',
    }),
  gender: z.enum(Gender).optional(),

  customer_type: z.enum(CustomerType),
});

// Update Customer Schema - All fields optional
export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),

  email: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
    z.email('Invalid email address').optional(),
  ),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional(),

  address: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().optional(),
  ),

  city: z.string().optional(),

  state: z.string().optional(),

  pincode: z.string().optional(),

  alt_phone: z
    .string()
    .optional()
    .refine(val => val === undefined || val === '' || /^[6-9]\d{9}$/.test(val), {
      message: 'Enter a valid 10-digit Indian mobile number',
    }),
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
});

// Query Schema for export customers (no pagination)
export const exportCustomerQuerySchema = z.object({
  search: z.string().trim().optional(), // Searches: name, email, phone

  customer_type: z.enum(CustomerType).optional(),
});

//Search Cutomer by phone number
export const searchCustomerByPhoneNumberSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

// Export types
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type GetCustomerQueryDto = z.infer<typeof getCustomerQuerySchema>;
export type ExportCustomerQueryDto = z.infer<typeof exportCustomerQuerySchema>;
export type SearchCustomerByPhoneNumberDto = z.infer<typeof searchCustomerByPhoneNumberSchema>;
