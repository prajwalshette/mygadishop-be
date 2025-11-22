export interface User {
  id?: string;
  email: string;
  password: string;
  role?: UserRole;
  name?: string;
  phone?: string;
  is_active?: boolean;
  deleted_at?: Date | null;
  shop_id?: string;
}

export interface AdminUser {
  id?: string;
  email: string;
  role?: AdminRole;
  password: string;
  name?: string;
  phone?: string;
  is_active?: boolean;
  deleted_at?: Date | null;
}

export interface ShopUserResponseDTO {
  id: string;
  shop_id: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  deleted_at: Date | null;
}

export enum AdminRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}
