import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.email('Invalid email address'),
    
  password: z.string().min(2, 'Password is required'),

  device_info: z.record(z.string(), z.any()).optional(),
  
  ip_address: z.string().optional(),
});


// Export types
export type LoginDto = z.infer<typeof loginSchema>;