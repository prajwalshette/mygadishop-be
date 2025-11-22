import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithAdmin, RequestWithOnboardTempUser } from '@/interfaces/auth.interface';
import { AuthService } from '@services/auth.service';
import { LoginDto } from '@/schemas/auth.schema';
import { OnboardShopDto } from '@/schemas/onboard.schema';

export class AuthController {
  public auth = Container.get(AuthService);

  // -----------------------------
  // ADMIN LOGIN - Authenticate admin user
  // -----------------------------
  public adminLogIn = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserData = request.body;
      const { cookie, findAdminUser, token } = await this.auth.adminLogIn(adminUserData);

      response.setHeader('Set-Cookie', [cookie]);
      response.status(200).json({ data: { admin: findAdminUser, token: token }, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // ADD ADMIN USER - Create new admin user
  // -----------------------------
  public addAdminUser = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserData = request.body;
      const adminUser = await this.auth.addAdminUser(adminUserData);

      response.status(200).json({ data: adminUser, message: 'New Admin Add Sucessfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // LOGOUT - Invalidate user session
  // -----------------------------
  public logOut = async (request: RequestWithAdmin, response: Response, next: NextFunction) => {
    try {
      const session_id = request.session_id;

      let token: string | undefined;

      // Fallback to header
      const headerToken = request.header('Authorization');
      if (!token && headerToken?.startsWith('Bearer ')) {
        token = headerToken.split('Bearer ')[1];
      }

      await this.auth.logout(token, session_id);

      response.setHeader('Set-Cookie', ['Authorization=; HttpOnly; Max-Age=0; Path=/']);

      return response.status(200).json({
        success: true,
        message: 'Logout successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UNIFIED LOGIN - Handles both existing users and new user creation
  // -----------------------------
  public login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: LoginDto = request.body;
      const result = await this.auth.login(userData);

      response.setHeader('Set-Cookie', [result.cookie]);

      if (result.newUser) {
        // New user - needs to complete onboarding
        response.status(200).json({ 
          data: { newUser: true }, 
          message: 'Account created. Please complete onboarding.' 
        });
      } else {
        // Existing user - logged in successfully
        response.status(200).json({ 
          data: { 
            newUser: false,
            user: result.user 
          }, 
          message: 'Login successful' 
        });
      }
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // ONBOARD SHOP - Complete shop onboarding process
  // -----------------------------
  public onboardShop = async (request: RequestWithOnboardTempUser, response: Response, next: NextFunction) => {
    try {
      const email = request.email;
      const onboardDetails: OnboardShopDto = request.body;
      const result = await this.auth.onboardShop(onboardDetails, email);

      response.setHeader('Set-Cookie', [result.cookie]);
      response.status(201).json({
        success: true,
        message: 'Shop onboarded successfully',
        data: {
          shop: {
            id: result.shop.id,
            email: result.shop.email,
            name: result.shop.shop_name,
            phone: result.shop.phone,
            website_url: result.shop.website_url,
            address: result.shop.address,
            city: result.shop.city,
            state: result.shop.state,
            pincode: result.shop.pincode,
            owner_name: result.shop.owner_name,
          },
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
