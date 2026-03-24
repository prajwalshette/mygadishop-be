import { z } from 'zod';

// Onboard Shop Schema
export const onboardShopSchema = z.object({
  email: z.email('Invalid email address'),
  
  shop_name: z.string().min(1, 'Shop name is required'),
  
  owner_name: z.string().min(1, 'Owner name is required'),
  
  phone: z.string().min(1, 'Phone number is required'),
  
  website_url: z.string().optional(),
  
  address: z.string().min(1, 'Address is required'),
  
  city: z.string().min(1, 'City is required'),
  
  state: z.string().min(1, 'State is required'),
  
  pincode: z.string().min(1, 'Pincode is required'),
  
  device_info: z.record(z.string(), z.any()).optional(),
  
  ip_address: z.string().optional(),
});

// Export types
export type OnboardShopDto = z.infer<typeof onboardShopSchema>;
