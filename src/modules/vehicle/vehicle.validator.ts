import { z } from 'zod';
import { FuelType, OwnershipType, TransmissionType, VehicleStatus, VehicleType } from './vehicle.interface';

// Create Vehicle Schema
export const createVehicleSchema = z.object({
  customer_id: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? null : val)),
  
  type: z.enum(VehicleType),
  
  brand: z.string().min(1, 'Brand is required'),
  
  model: z.string().min(1, 'Model is required'),
  
  variant: z.string().optional(),
  
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  
  registration_number: z.string().min(1, 'Registration number is required'),
  
  chassis_number: z.string().min(1, 'Chassis number is required'),
  
  engine_number: z.string().min(1, 'Engine number is required'),
  
  color: z.string().min(1, 'Color is required'),
  
  mileage: z.number().min(0, 'Mileage must be positive'),
  
  fuel_type: z.enum(FuelType),
  
  transmission: z.enum(TransmissionType),
  
  engine_capacity: z.number().positive().optional(),
  
  ownership: z.enum(OwnershipType),
  
  insurance_valid_till: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),

  registration_valid_till: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),

  puc_valid_till: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),
  
  buying_price: z.number().min(0).optional(),
  
  selling_price: z.number().min(0).optional(),

  min_selling_price: z.number().min(0).optional(),

  is_price_negotiable: z
    .union([
      z.boolean(),
      z.string().transform((v) => v === 'true'),
    ])
    .optional(),
  
  vehicle_image_urls: z.array(z.string().url()).optional(),
  
  vehicle_doc_urls: z.array(z.string().url()).optional(),
  
  status: z.enum(VehicleStatus),
  
  buying_date: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return new Date();
      const date = new Date(val);
      return isNaN(date.getTime()) ? new Date() : date;
    }),
    z.date(),
  ]),
  
  selling_date: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),
  
  features: z.array(z.string()).optional(),
  
  description: z.string().optional(),

  is_featured: z
    .union([
      z.boolean(),
      z.string().transform((v) => v === 'true'),
    ])
    .optional(),

  featured_until: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),

  slug: z.string().trim().min(1).optional(),
  meta_title: z.string().trim().optional(),
  meta_description: z.string().trim().optional(),
});

// Update Vehicle Schema - All fields optional
export const updateVehicleSchema = z.object({
  customer_id: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === '' ? null : val)),
  
  type: z.enum(VehicleType).optional(),
  
  brand: z.string().min(1).optional(),
  
  model: z.string().min(1).optional(),
  
  variant: z.string().optional(),
  
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  
  registration_number: z.string().min(1).optional(),
  
  chassis_number: z.string().min(1).optional(),
  
  engine_number: z.string().min(1).optional(),
  
  color: z.string().min(1).optional(),
  
  mileage: z.number().min(0).optional(),
  
  fuel_type: z.enum(FuelType).optional(),
  
  transmission: z.enum(TransmissionType).optional(),
  
  engine_capacity: z.number().positive().optional(),
  
  ownership: z.enum(OwnershipType).optional(),
  
  insurance_valid_till: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),

  registration_valid_till: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),

  puc_valid_till: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),
  
  buying_price: z.number().min(0).optional(),
  
  selling_price: z.number().min(0).optional(),

  min_selling_price: z.number().min(0).optional(),

  is_price_negotiable: z
    .union([
      z.boolean(),
      z.string().transform((v) => v === 'true'),
    ])
    .optional(),
  
  vehicle_image_urls: z.array(z.string().url()).optional(),
  
  vehicle_doc_urls: z.array(z.string().url()).optional(),
  
  status: z.enum(VehicleStatus).optional(),
  
  buying_date: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),
  
  selling_date: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),
  
  features: z.array(z.string()).optional(),
  
  description: z.string().optional(),

  is_featured: z
    .union([
      z.boolean(),
      z.string().transform((v) => v === 'true'),
    ])
    .optional(),

  featured_until: z.union([
    z.string().transform((val) => {
      if (!val || val === '') return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.date(),
    z.null(),
  ]).optional(),

  slug: z.string().trim().min(1).optional(),
  meta_title: z.string().trim().optional(),
  meta_description: z.string().trim().optional(),
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
  
  status: z.enum(VehicleStatus).optional(),
  
  type: z.enum(VehicleType).optional(),
  
  sortBy: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query Schema for export vehicles (no pagination)
export const exportVehicleQuerySchema = z.object({
  search: z.string().trim().optional(), // Searches: brand, model, variant, registration_number, chassis_number, engine_number
  
  status: z.enum(VehicleStatus).optional(),
  
  type: z.enum(VehicleType).optional(),
  
  sortBy: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Export types
export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type GetVehicleQueryDto = z.infer<typeof getVehicleQuerySchema>;
export type ExportVehicleQueryDto = z.infer<typeof exportVehicleQuerySchema>;
 
