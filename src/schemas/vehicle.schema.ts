import { z } from 'zod';
import { VehicleType, FuelType, TransmissionType, BikeStatus, OwnershipType } from '@/interfaces/vehicle.interface';

// Create Vehicle Schema
export const createVehicleSchema = z.object({
  customer_id: z.string().optional(),
  
  type: z.nativeEnum(VehicleType),
  
  brand: z.string().min(1, 'Brand is required'),
  
  model: z.string().min(1, 'Model is required'),
  
  variant: z.string().optional(),
  
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  
  registration_number: z.string().min(1, 'Registration number is required'),
  
  chassis_number: z.string().min(1, 'Chassis number is required'),
  
  engine_number: z.string().min(1, 'Engine number is required'),
  
  color: z.string().min(1, 'Color is required'),
  
  mileage: z.number().min(0, 'Mileage must be positive'),
  
  fuel_type: z.nativeEnum(FuelType),
  
  transmission: z.nativeEnum(TransmissionType),
  
  engine_capacity: z.number().positive().optional(),
  
  ownership: z.nativeEnum(OwnershipType),
  
  insurance_valid_till: z.string().datetime().or(z.date()),
  
  price: z.number().min(0, 'Price must be positive'),
  
  buying_price: z.number().min(0).optional(),
  
  selling_price: z.number().min(0).optional(),
  
  vehicle_image_urls: z.array(z.string().url()).optional(),
  
  vehicle_doc_urls: z.array(z.string().url()).optional(),
  
  status: z.nativeEnum(BikeStatus),
  
  buying_date: z.string().datetime().or(z.date()),
  
  selling_date: z.string().datetime().or(z.date()).optional(),
});

// Update Vehicle Schema - All fields optional
export const updateVehicleSchema = z.object({
  customer_id: z.string().optional(),
  
  type: z.nativeEnum(VehicleType).optional(),
  
  brand: z.string().min(1).optional(),
  
  model: z.string().min(1).optional(),
  
  variant: z.string().optional(),
  
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  
  registration_number: z.string().min(1).optional(),
  
  chassis_number: z.string().min(1).optional(),
  
  engine_number: z.string().min(1).optional(),
  
  color: z.string().min(1).optional(),
  
  mileage: z.number().min(0).optional(),
  
  fuel_type: z.nativeEnum(FuelType).optional(),
  
  transmission: z.nativeEnum(TransmissionType).optional(),
  
  engine_capacity: z.number().positive().optional(),
  
  ownership: z.nativeEnum(OwnershipType).optional(),
  
  insurance_valid_till: z.string().datetime().or(z.date()).optional(),
  
  price: z.number().min(0).optional(),
  
  buying_price: z.number().min(0).optional(),
  
  selling_price: z.number().min(0).optional(),
  
  vehicle_image_urls: z.array(z.string().url()).optional(),
  
  vehicle_doc_urls: z.array(z.string().url()).optional(),
  
  status: z.nativeEnum(BikeStatus).optional(),
  
  buying_date: z.string().datetime().or(z.date()).optional(),
  
  selling_date: z.string().datetime().or(z.date()).optional(),
});

// Vehicle ID Param Schema
export const VehicleIdParamSchema = z.object({
  id: z.string().ulid({ message: 'Invalid Vehicle Id' }),
});

// Query Schema for get all vehicles
export const getVehicleQuerySchema = z.object({
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
    
  search: z.string().trim().optional(), // Searches: brand, model, variant, registration_number, chassis_number, engine_number
  
  status: z.nativeEnum(BikeStatus).optional(),
  
  type: z.nativeEnum(VehicleType).optional(),
  
  sortBy: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Export types
export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type GetVehicleQueryDto = z.infer<typeof getVehicleQuerySchema>;
 
