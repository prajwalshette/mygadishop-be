import { z } from 'zod';
import { ShopBusinessType } from '@prisma/client';

// Login Schema
export const loginSchema = z.object({
  email: z.email('Invalid email address'),

  password: z.string().min(2, 'Password is required'),

  device_info: z.record(z.string(), z.any()).optional(),

  ip_address: z.string().optional(),
});

// Onboard Shop Schema (POST /auth/shop-onboard)
export const onboardShopSchema = z.object({
  email: z.email('Invalid email address'),

  shop_name: z.string().min(1, 'Shop name is required'),

  owner_name: z.string().min(1, 'Owner name is required'),

  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  website_url: z.string().optional(),

  address: z.string().min(1, 'Address is required'),

  city: z.string().min(1, 'City is required'),

  state: z.string().min(1, 'State is required'),

  pincode: z.string().min(1, 'Pincode is required'),

  shop_business_type: z.enum(ShopBusinessType, {
    message: 'Select a valid shop business type',
  }),

  device_info: z.record(z.string(), z.any()).optional(),

  ip_address: z.string().optional(),
});

// Export types
export type LoginDto = z.infer<typeof loginSchema>;
export type OnboardShopDto = z.infer<typeof onboardShopSchema>;
