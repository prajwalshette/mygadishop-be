
import { PlatformAdminRole, ShopUserRole } from "@prisma/client";
export interface User {
  id?: string;
  email: string;
  password?: string; // Optional - not included in cache for security
  role?: ShopUserRole;
  name?: string;
  phone?: string;
  is_active?: boolean;
  deleted_at?: Date | null;
  shop_id?: string;
}

export interface AdminUser {
  id?: string;
  email: string;
  role?: PlatformAdminRole;
  password?: string; // Optional - not included in cache for security
  name?: string;
  phone?: string;
  is_active?: boolean
  deleted_at?: Date | null;
}

export interface ShopUserResponseDTO {
  id: string;
  shop_id: string;
  name?: string;
  email: string;
  phone?: string;
  role: ShopUserRole;
  is_active: boolean;
  deleted_at: Date | null;
}

export { PlatformAdminRole, ShopUserRole };
