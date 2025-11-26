import { z } from 'zod';
import { PaymentMethod, PaymentStatus, PaymentType } from '@/interfaces/vehiclePayment.interface';

// Create Vehicle Payment Schema
export const createVehiclePaymentSchema = z.object({
  shop_id: z.string().min(1, 'Shop ID is required').optional(), // Will be set by controller from request.shop_id
  
  vehicle_id: z.string().min(1, 'Vehicle ID is required'),
  
  customer_id: z.string().min(1, 'Customer ID is required'),
  
  amount: z.number().min(0, 'Amount must be positive'),
  
  payment_type: z.nativeEnum(PaymentType).default(PaymentType.VEHICLE_SALE),
  
  method: z.nativeEnum(PaymentMethod),
  
  status: z.nativeEnum(PaymentStatus),
  
  transaction_id: z.string().optional(),
  
  payment_receipt_images: z.array(z.string()).optional().default([]),
  
  notes: z.string().optional(),
});

// Update Vehicle Payment Schema - All fields optional
export const updateVehiclePaymentSchema = z.object({
  shop_id: z.string().min(1).optional(),
  
  vehicle_id: z.string().min(1).optional(),
  
  customer_id: z.string().min(1).optional(),
  
  amount: z.number().min(0).optional(),
  
  payment_type: z.nativeEnum(PaymentType).optional(),
  
  method: z.nativeEnum(PaymentMethod).optional(),
  
  status: z.nativeEnum(PaymentStatus).optional(),
  
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

// Export types
export type CreateVehiclePaymentDto = z.infer<typeof createVehiclePaymentSchema>;
export type UpdateVehiclePaymentDto = z.infer<typeof updateVehiclePaymentSchema>;
export type GetAllPaymentsQueryDto = z.infer<typeof getAllPaymentsQuerySchema>;
