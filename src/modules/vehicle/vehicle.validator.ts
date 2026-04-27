import { z } from 'zod';
import {
  DocumentType,
  FuelType,
  OwnershipType,
  TransmissionType,
  VehicleStatus,
  VehicleType,
  VehicleCategory,
  InsuranceType,
  VehicleCondition,
  TwoWheelerType,
  StartType,
  AbsType,
  CarBodyType,
  DriveType,
} from '@prisma/client';

const vehicleDocumentBodySchema = z.object({
  doc_type: z.nativeEnum(DocumentType),
  file_url: z.string().url().optional(),
  expiry_date: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }),
      z.date(),
      z.null(),
    ])
    .optional(),
  notes: z.string().optional(),
});

const twoWheelerDetailSchema = z.object({
  engine_capacity_cc: z.number().int().positive().nullable().optional(),
  max_power_bhp: z.number().positive().nullable().optional(),
  max_torque_nm: z.number().positive().nullable().optional(),
  top_speed_kmh: z.number().int().positive().nullable().optional(),
  mileage_kmpl: z.number().positive().nullable().optional(),
  range_km: z.number().positive().nullable().optional(),
  battery_capacity_kwh: z.number().positive().nullable().optional(),
  charging_time_hrs: z.number().positive().nullable().optional(),
  two_wheeler_type: z.nativeEnum(TwoWheelerType),
  start_type: z.nativeEnum(StartType).nullable().optional(),
  abs_type: z.nativeEnum(AbsType).nullable().optional(),
  has_disc_brake: z.boolean().optional().default(false),
  has_alloy_wheels: z.boolean().optional().default(false),
  has_bluetooth: z.boolean().optional().default(false),
});

const fourWheelerDetailSchema = z.object({
  body_type: z.nativeEnum(CarBodyType),
  engine_capacity_cc: z.number().int().positive().nullable().optional(),
  max_power_bhp: z.number().positive().nullable().optional(),
  max_torque_nm: z.number().positive().nullable().optional(),
  mileage_kmpl: z.number().positive().nullable().optional(),
  range_km: z.number().positive().nullable().optional(),
  battery_capacity_kwh: z.number().positive().nullable().optional(),
  no_of_cylinders: z.number().int().positive().nullable().optional(),
  drive_type: z.nativeEnum(DriveType).nullable().optional(),
  no_of_doors: z.number().int().positive().nullable().optional(),
  seating_capacity: z.number().int().positive().nullable().optional(),
  boot_space_litres: z.number().int().positive().nullable().optional(),
  no_of_airbags: z.number().int().nonnegative().nullable().optional(),
  has_abs: z.boolean().optional().default(false),
  has_esp: z.boolean().optional().default(false),
  ncap_rating: z.number().int().min(0).max(5).nullable().optional(),
  has_sunroof: z.boolean().optional().default(false),
  has_cruise_control: z.boolean().optional().default(false),
  has_android_auto: z.boolean().optional().default(false),
  has_apple_carplay: z.boolean().optional().default(false),
  has_360_camera: z.boolean().optional().default(false),
  has_ventilated_seats: z.boolean().optional().default(false),
});

// Create Vehicle Schema
export const createVehicleSchema = z.object({
  seller_customer_id: z
    .string()
    .optional()
    .transform(val => (val === undefined || val === '' ? null : val)),

  buyer_customer_id: z
    .string()
    .optional()
    .transform(val => (val === undefined || val === '' ? null : val)),

  vehicle_category: z.nativeEnum(VehicleCategory),
  vehicle_type: z.nativeEnum(VehicleType),

  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().optional().nullable(),

  manufacture_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  registration_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),

  registration_number: z.string().min(1, 'Registration number is required'),
  chassis_number: z.string().min(1, 'Chassis number is required'),
  engine_number: z.string().min(1, 'Engine number is required'),
  color: z.string().min(1, 'Color is required'),

  odometer_reading: z.number().min(0, 'Odometer reading must be positive'),
  condition: z.nativeEnum(VehicleCondition),
  accident_history: z
    .union([z.boolean(), z.string().transform(v => v === 'true')])
    .optional()
    .default(false),
  flood_affected: z
    .union([z.boolean(), z.string().transform(v => v === 'true')])
    .optional()
    .default(false),
  condition_notes: z.string().optional().nullable(),

  fuel_type: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(TransmissionType),

  insurance_valid_till: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }),
      z.date(),
      z.null(),
    ])
    .optional(),

  registration_valid_till: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }),
      z.date(),
      z.null(),
    ])
    .optional(),

  puc_valid_till: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }),
      z.date(),
      z.null(),
    ])
    .optional(),

  insurance_type: z.nativeEnum(InsuranceType).optional().nullable(),

  is_hypothecation: z
    .union([z.boolean(), z.string().transform(v => v === 'true')])
    .optional()
    .default(false),
  hypothecation_bank: z.string().optional().nullable(),
  rc_available: z
    .union([z.boolean(), z.string().transform(v => v === 'true')])
    .optional()
    .default(true),

  ownership: z.nativeEnum(OwnershipType),
  ownership_city: z.string().optional().nullable(),
  ownership_state: z.string().optional().nullable(),

  buying_price: z.number().min(0).optional().nullable(),
  selling_price: z.number().min(0).optional().nullable(),
  min_selling_price: z.number().min(0).optional().nullable(),
  is_price_negotiable: z
    .union([z.boolean(), z.string().transform(v => v === 'true')])
    .optional()
    .default(true),
  estimated_rto_charges: z.number().min(0).optional().nullable(),

  vehicle_image_urls: z.array(z.string().url()).optional(),
  inspection_report_url: z.string().url().optional().nullable(),

  /** Existing document URLs / metadata when not uploading a new file for that type. */
  vehicle_documents: z.array(vehicleDocumentBodySchema).optional(),

  status: z.nativeEnum(VehicleStatus),

  buying_date: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return new Date();
        const date = new Date(val);
        return isNaN(date.getTime()) ? new Date() : date;
      }),
      z.date(),
    ])
    .optional()
    .default(() => new Date()),

  selling_date: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }),
      z.date(),
      z.null(),
    ])
    .optional(),

  description: z.string().optional().nullable(),

  is_featured: z
    .union([z.boolean(), z.string().transform(v => v === 'true')])
    .optional()
    .default(false),

  featured_until: z
    .union([
      z.string().transform(val => {
        if (!val || val === '') return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }),
      z.date(),
      z.null(),
    ])
    .optional(),

  two_wheeler_detail: twoWheelerDetailSchema.optional().nullable(),
  four_wheeler_detail: fourWheelerDetailSchema.optional().nullable(),
});

// Update Vehicle Schema - All fields optional
export const updateVehicleSchema = createVehicleSchema.partial();

// Vehicle ID Param Schema
export const VehicleIdParamSchema = z.object({
  id: z.string().ulid({ message: 'Invalid Vehicle Id' }),
});

export const VehicleDocumentParamSchema = z.object({
  id: z.string().ulid({ message: 'Invalid Vehicle Id' }),
  docType: z.nativeEnum(DocumentType),
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

  status: z.nativeEnum(VehicleStatus).optional(),

  vehicle_category: z.nativeEnum(VehicleCategory).optional(),
  type: z.nativeEnum(VehicleType).optional(), // Keep 'type' for compat in query if needed, or use vehicle_type

  sortBy: z.enum(['created_at', 'updated_at', 'selling_price', 'manufacture_year', 'odometer_reading']).optional().default('created_at'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query Schema for export vehicles (no pagination)
export const exportVehicleQuerySchema = getVehicleQuerySchema.omit({ page: true, limit: true });

// Export types
export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type GetVehicleQueryDto = z.infer<typeof getVehicleQuerySchema>;
export type ExportVehicleQueryDto = z.infer<typeof exportVehicleQuerySchema>;
 
