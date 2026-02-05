import { z } from 'zod';
import { ServicingStatus } from '@/interfaces/servicing.interface';

// Create Servicing Schema
export const createServicingSchema = z.object({
 
  vehicle_id: z.string().min(1, 'Vehicle ID is required'),
  
  customer_id: z.string().min(1, 'Customer ID is required'),
  
  service_date: z.string().datetime().or(z.date()),
  
  service_type: z.string().min(1, 'Service type is required'),
  
  description: z.string().optional(),
  
  labor_cost: z.number().min(0, 'Labor cost must be positive').default(0),
  
  parts_cost: z.number().min(0, 'Parts cost must be positive').default(0),
  
  other_charges: z.number().min(0).optional().default(0),
  
  total_cost: z.number().min(0, 'Total cost must be positive'),
  
  status: z.nativeEnum(ServicingStatus),
  
  next_service_date: z.string().datetime().or(z.date()).optional(),
  
  next_service_km: z.number().int().min(0).optional(),
  
  technician_name: z.string().optional(),
  
  odometer_reading: z.number().int().min(0).optional(),
  
  rating: z.number().int().min(1).max(5).optional(),
  
  customer_feedback: z.string().optional(),
  
  service_images: z.array(z.string()).optional().default([]),
  
  parts_replaced: z.array(z.string()).optional().default([]),
});

// Update Servicing Schema - All fields optional
export const updateServicingSchema = z.object({
  shop_id: z.string().min(1).optional(),
  
  vehicle_id: z.string().min(1).optional(),
  
  customer_id: z.string().min(1).optional(),
  
  service_date: z.string().datetime().or(z.date()).optional(),
  
  service_type: z.string().min(1).optional(),
  
  description: z.string().optional(),
  
  labor_cost: z.number().min(0).optional(),
  
  parts_cost: z.number().min(0).optional(),
  
  other_charges: z.number().min(0).optional(),
  
  total_cost: z.number().min(0).optional(),
  
  status: z.nativeEnum(ServicingStatus).optional(),
  
  next_service_date: z.string().datetime().or(z.date()).optional(),
  
  next_service_km: z.number().int().min(0).optional(),
  
  technician_name: z.string().optional(),
  
  odometer_reading: z.number().int().min(0).optional(),
  
  rating: z.number().int().min(1).max(5).optional(),
  
  customer_feedback: z.string().optional(),
  
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
    
  search: z.string().trim().optional(), // Searches: service_type, description
  
  status: z.nativeEnum(ServicingStatus).optional(),
  
  vehicle_id: z.string().optional(),
  
  customer_id: z.string().optional(),
  
  sortBy: z.enum(['service_date', 'created_at', 'updated_at']).optional().default('service_date'),
  
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query Schema for export servicings (no pagination)
export const exportServicingQuerySchema = z.object({
  search: z.string().trim().optional(), // Searches: service_type, description
  
  status: z.nativeEnum(ServicingStatus).optional(),
  
  vehicle_id: z.string().optional(),
  
  customer_id: z.string().optional(),
  
  sortBy: z.enum(['service_date', 'created_at', 'updated_at']).optional().default('service_date'),
  
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Export types
export type CreateServicingDto = z.infer<typeof createServicingSchema>;
export type UpdateServicingDto = z.infer<typeof updateServicingSchema>;
export type GetServicingQueryDto = z.infer<typeof getServicingQuerySchema>;
export type ExportServicingQueryDto = z.infer<typeof exportServicingQuerySchema>;
