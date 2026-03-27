import { z } from 'zod';
import { PaymentMethod, PaymentStatus, PaymentType } from './payment.interface';

// Create Vehicle Payment Schema
export const createVehiclePaymentSchema = z.object({
  shop_id: z.string().min(1, 'Shop ID is required').optional(), // Will be set by controller from request.shop_id

  vehicle_id: z.string().min(1, 'Vehicle ID is required'),

  customer_id: z.string().min(1, 'Customer ID is required'),

  amount: z.coerce.number().min(0, 'Amount must be positive'),

  paid_amount: z.coerce.number().min(0).optional(),

  balance_due: z.coerce.number().min(0).optional(),

  payment_type: z.enum(PaymentType).default(PaymentType.VEHICLE_SALE),

  method: z.enum(PaymentMethod),

  status: z.enum(PaymentStatus),

  transaction_id: z.string().optional(),

  payment_receipt_images: z.array(z.string()).optional().default([]),

  notes: z.string().optional(),
});

// Update Vehicle Payment Schema - All fields optional
export const updateVehiclePaymentSchema = z.object({
  shop_id: z.string().min(1).optional(),

  vehicle_id: z.string().min(1).optional(),

  customer_id: z.string().min(1).optional(),

  amount: z.coerce.number().min(0).optional(),

  paid_amount: z.coerce.number().min(0).optional(),

  balance_due: z.coerce.number().min(0).optional(),

  payment_type: z.enum(PaymentType).optional(),

  method: z.enum(PaymentMethod).optional(),

  status: z.enum(PaymentStatus).optional(),

  transaction_id: z.string().optional(),

  payment_receipt_images: z.array(z.string()).optional(),

  notes: z.string().optional(),
});

// Payment ID Param Schema
export const paymentIdParamSchema = z.object({
  id: z.string().ulid({ message: 'Invalid Payment ID' }),
});

// Vehicle ID Param Schema
export const vehicleIdParamSchema = z.object({
  vehicle_id: z.string().ulid({ message: 'Invalid Vehicle ID' }),
});

// Get All Payments Query Schema
export const getAllPaymentsQuerySchema = z.object({
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

// Export Payments Query Schema (for CSV export)
export const exportPaymentsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(PaymentStatus).optional(),
  payment_type: z.enum(PaymentType).optional(),
  method: z.enum(PaymentMethod).optional(),
  search: z.string().trim().optional(),
});

// Export types
export type CreateVehiclePaymentDto = z.infer<typeof createVehiclePaymentSchema>;
export type UpdateVehiclePaymentDto = z.infer<typeof updateVehiclePaymentSchema>;
export type GetAllPaymentsQueryDto = z.infer<typeof getAllPaymentsQuerySchema>;
export type ExportPaymentsQueryDto = z.infer<typeof exportPaymentsQuerySchema>;
