export interface User {
  id?: number;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AdminUser {
  id?: string;
  email: string;
  role?: AdminRole;
  password: string;
  name?: string;
}

export interface ShopUserResponseDTO {
  id: string;
  shop_id: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_deleted: boolean;
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
