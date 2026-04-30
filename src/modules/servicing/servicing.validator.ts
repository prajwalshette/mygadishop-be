import { z } from 'zod';
import { PaymentMethod, PaymentStatus, ServicingStatus, VehicleType } from '@prisma/client';

// Create Servicing Schema (matches Prisma Servicing — vehicle snapshot, no vehicle_id)
export const createServicingSchema = z
  .object({
    customer_id: z.preprocess(
      val => (val === '' || val === null || val === undefined ? undefined : String(val).trim()),
      z.string().min(1).optional(),
    ),
    /** When customer_id is omitted: used to create a SERVICE_ONLY customer first */
    customer_name: z.preprocess(
      val => (val === '' || val === null || val === undefined ? undefined : String(val).trim()),
      z.string().min(1, 'Name is required').optional(),
    ),
    customer_phone: z.preprocess(
      val => (val === '' || val === null || val === undefined ? undefined : String(val).trim()),
      z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional(),
    ),

  vehicle_brand: z.string().min(1, 'Vehicle brand is required'),
  vehicle_model: z.string().min(1, 'Vehicle model is required'),
  vehicle_variant: z.string().optional(),
  vehicle_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicle_type: z.enum(VehicleType),
  vehicle_reg_number: z.string().optional(),

  service_date: z.coerce.date(),
  service_type: z.string().min(1, 'Service type is required'),

  description: z.string().optional(),

  labor_cost: z.number().min(0, 'Labor cost must be non-negative').default(0),
  parts_cost: z.number().min(0, 'Parts cost must be non-negative').default(0),
  other_charges: z.number().min(0).optional().default(0),
  total_cost: z.number().min(0, 'Total cost must be non-negative'),

  status: z.enum(ServicingStatus),

  next_service_date: z.coerce.date().optional(),
  next_service_km: z.number().int().min(0).optional(),

  technician_name: z.string().optional(),
  odometer_reading: z.number().int().min(0).optional(),

  rating: z.number().int().min(1).max(5).optional(),
  customer_feedback: z.string().optional(),

  payment_status: z.enum(PaymentStatus).optional().default(PaymentStatus.PENDING),
  paid_amount: z.number().min(0).optional().default(0),
  payment_method: z.enum(PaymentMethod).optional(),
  payment_date: z.coerce.date().optional(),

  service_images: z.array(z.string()).optional().default([]),
  parts_replaced: z.array(z.string()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const hasCustomerId = !!data.customer_id;
    if (hasCustomerId) return;

    if (!data.customer_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customer_name is required when customer_id is omitted',
        path: ['customer_name'],
      });
    }
    if (!data.customer_phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customer_phone is required when customer_id is omitted',
        path: ['customer_phone'],
      });
    }
  });

// Update Servicing Schema — all optional except nothing required
export const updateServicingSchema = z.object({
  customer_id: z.string().min(1).optional(),

  vehicle_brand: z.string().min(1).optional(),
  vehicle_model: z.string().min(1).optional(),
  vehicle_variant: z.string().optional().nullable(),
  vehicle_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  vehicle_type: z.enum(VehicleType).optional(),
  vehicle_reg_number: z.string().optional().nullable(),

  service_date: z.coerce.date().optional(),
  service_type: z.string().min(1).optional(),

  description: z.string().optional().nullable(),

  labor_cost: z.number().min(0).optional(),
  parts_cost: z.number().min(0).optional(),
  other_charges: z.number().min(0).optional(),
  total_cost: z.number().min(0).optional(),

  status: z.enum(ServicingStatus).optional(),

  next_service_date: z.coerce.date().optional().nullable(),
  next_service_km: z.number().int().min(0).optional().nullable(),

  technician_name: z.string().optional().nullable(),
  odometer_reading: z.number().int().min(0).optional().nullable(),

  rating: z.number().int().min(1).max(5).optional().nullable(),
  customer_feedback: z.string().optional().nullable(),

  payment_status: z.enum(PaymentStatus).optional(),
  paid_amount: z.number().min(0).optional(),
  payment_method: z.enum(PaymentMethod).optional().nullable(),
  payment_date: z.coerce.date().optional().nullable(),

  service_images: z.array(z.string()).optional(),
  parts_replaced: z.array(z.string()).optional(),
});

// Servicing ID Param Schema
export const servicingIdParamSchema = z.object({
  id: z.string().ulid({ message: 'Invalid Servicing Id' }),
});

// Query Schema for get all servicings
export const getServicingQuerySchema = z.object({
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

  status: z.enum(ServicingStatus).optional(),

  vehicle_reg_number: z.string().trim().optional(),

  customer_id: z.string().optional(),

  sortBy: z.enum(['service_date', 'created_at', 'updated_at']).optional().default('service_date'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query Schema for export servicings (no pagination)
export const exportServicingQuerySchema = z.object({
  search: z.string().trim().optional(),

  status: z.enum(ServicingStatus).optional(),

  vehicle_reg_number: z.string().trim().optional(),

  customer_id: z.string().optional(),

  sortBy: z.enum(['service_date', 'created_at', 'updated_at']).optional().default('service_date'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Export types
export type CreateServicingDto = z.infer<typeof createServicingSchema>;
export type UpdateServicingDto = z.infer<typeof updateServicingSchema>;
export type GetServicingQueryDto = z.infer<typeof getServicingQuerySchema>;
export type ExportServicingQueryDto = z.infer<typeof exportServicingQuerySchema>;
