export interface User {
    id?: number;
    email: string;
    password: string;
  }


  export interface AdminUser {
    id?: string;
    email: string;
    role?: AdminRole;
    password: string;
    name?: string;
  }

export enum AdminRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}