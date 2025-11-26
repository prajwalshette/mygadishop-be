import { z } from 'zod';
import { UserRole } from '@/interfaces/users.interface';

// Create User Schema
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.STAFF),
});

// Update User Schema
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  role: z.nativeEnum(UserRole).optional(),
  is_active: z.boolean().optional(),
});

// Update User Password Schema
export const updateUserPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// User ID Param Schema
export const userIdParamSchema = z.object({
  id: z.string().ulid({ message: 'Invalid User ID' }),
});

// Get All Users Query Schema
export const getAllUsersQuerySchema = z.object({
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
  role: z.nativeEnum(UserRole).optional(),
  is_active: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional(),
});

// Export types
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserPasswordDto = z.infer<typeof updateUserPasswordSchema>;
export type GetAllUsersQueryDto = z.infer<typeof getAllUsersQuerySchema>;
