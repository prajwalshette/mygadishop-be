import { z } from 'zod';
import { AdminRole } from '@/interfaces/users.interface';

// Admin Login Schema
export const adminLoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(9, 'Password must be at least 9 characters').max(32, 'Password must not exceed 32 characters'),
  device_info: z.record(z.string(), z.any()).optional(),
});

// Add Admin User Schema
export const addAdminUserSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(9, 'Password must be at least 9 characters').max(32, 'Password must not exceed 32 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(AdminRole),
});

// Export types
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;
export type AddAdminDto = z.infer<typeof addAdminUserSchema>;
