import { Request } from 'express';
import { AdminUser, User } from '@modules/user/user.interface';

export interface DataStoredInToken {
  id: string;
  session_id: string;
}

export interface DataStoredInUserToken {
  user_id: string;
  session_id: string;
  shop_id: string;
}

export interface DataStoredInOnboardTempToken {
  email: string;
}

/** Public customer JWT; session validity is enforced via Redis (see PublicUserSessionCache). */
export interface DataStoredInPublicUserToken {
  public_user_id: string;
  session_id: string;
}

export interface PublicUserAuth {
  id: string;
  email: string | null;
  phone: string | null;
  is_phone_verified: boolean;
  is_email_verified: boolean;
}

export interface RequestWithPublicUser extends Request {
  publicUser?: PublicUserAuth;
  session_id?: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithAdminUser extends Request {
  user?: AdminUser;
}

export interface RequestWithAdmin extends Request {
  admin?: AdminUser;
  session_id?: string;
}

export interface RequestWithUser extends Request {
  user?: User;
  session_id?: string;
  shop_id?: string;

  // Extended properties for file uploads
  vehicleFiles?: {
    vehicleFiles?: Express.Multer.File[];
  };

  vehicleDocFiles?: {
    vehicleDocFiles?: Express.Multer.File[];
  };

  paymentReceiptFiles?: {
    paymentReceiptFiles?: Express.Multer.File[];
  };
}

export interface RequestWithOnboardTempUser extends Request {
  email?: string;
}
