import { z } from 'zod';
import { ShopType } from './shop.interface';

// Update Shop Schema
export const updateShopSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  
  owner_name: z.string().min(1, 'Owner name is required'),
  
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  
  website_url: z.string().url('Invalid URL format').optional(),
  
  address: z.string().min(1, 'Address is required'),
  
  city: z.string().min(1, 'City is required'),
  
  state: z.string().min(1, 'State is required'),
  
  pincode: z.string().min(6, 'Pincode must be at least 6 digits'),
  
  gstin: z.string().optional(),
  
  established_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  
  shop_logo_url: z.string().url('Invalid URL format').optional(),
  
  shop_type: z.enum(ShopType).optional(),
});

// Get All Shops Query Schema
export const getAllShopsQuerySchema = z.object({
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
export type UpdateShopDto = z.infer<typeof updateShopSchema>;
export type GetAllShopsQueryDto = z.infer<typeof getAllShopsQuerySchema>;
