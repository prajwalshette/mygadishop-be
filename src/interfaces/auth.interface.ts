import { Request } from 'express';
import { AdminUser } from '@interfaces/users.interface';

export interface DataStoredInToken {
  id: string;
  session_id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: AdminUser;
}

export interface RequestWithAdmin extends Request {
  admin: AdminUser;
  session_id: string;

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

