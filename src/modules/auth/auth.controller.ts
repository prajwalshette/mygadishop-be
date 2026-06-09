import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithAdmin, RequestWithOnboardTempUser, RequestWithPublicUser, RequestWithUser } from './auth.interface';
import { AuthService } from './auth.service';
import type { LoginDto } from './auth.validator';
import type { OnboardShopDto } from './auth.validator';
import type { PublicUserLoginDto, PublicUserRegisterDto } from './auth.validator';

export class AuthController {
  public auth = Container.get(AuthService);

  // -----------------------------
  // ADMIN LOGIN - Authenticate admin user
  // -----------------------------
  public adminLogIn = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserData = request.body;
      const { cookie, findAdminUser } = await this.auth.adminLogIn(adminUserData);

      response.setHeader('Set-Cookie', [cookie]);
      response.status(200).json({ data: findAdminUser, message: 'login' });
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
  public logOut = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const session_id = request.session_id;

      let token: string | undefined;
      const cookieToken = request.cookies?.['Authorization'];
      if (cookieToken) {
        token = cookieToken;
      } else {
        const headerToken = request.header('Authorization');
        if (headerToken?.startsWith('Bearer ')) {
          token = headerToken.split('Bearer ')[1];
        }
      }

      await this.auth.logout(token, session_id);

      const isProduction = process.env.NODE_ENV === 'production';
      response.setHeader('Set-Cookie', [
        `Authorization=; HttpOnly; Max-Age=0; Path=/; SameSite=${isProduction ? 'None' : 'Lax'}${isProduction ? '; Secure' : ''}`,
      ]);

      return response.status(200).json({
        success: true,
        message: 'Logout successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // ADMIN LOGOUT - Invalidate admin session
  // -----------------------------
  public adminLogOut = async (request: RequestWithAdmin, response: Response, next: NextFunction) => {
    try {
      const session_id = request.session_id;

      // Extract token from cookie or header (same as middleware)
      let token: string | undefined;
      const cookieToken = request.cookies?.['Authorization'];
      if (cookieToken) {
        token = cookieToken;
      } else {
        const headerToken = request.header('Authorization');
        if (headerToken?.startsWith('Bearer ')) {
          token = headerToken.split('Bearer ')[1];
        }
      }

      await this.auth.adminLogout(token, session_id);

      const isProduction = process.env.NODE_ENV === 'production';
      response.setHeader('Set-Cookie', [
        `Authorization=; HttpOnly; Max-Age=0; Path=/; SameSite=${isProduction ? 'None' : 'Lax'}${isProduction ? '; Secure' : ''}`,
      ]);

      return response.status(200).json({
        success: true,
        message: 'Admin logout successfully',
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
          message: 'Account created. Please complete onboarding.',
        });
      } else {
        // Existing user - logged in successfully
        response.status(200).json({
          data: {
            newUser: false,
            user: result.user,
          },
          message: 'Login successful',
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

  // -----------------------------
  // PUBLIC USER — Register (phone required)
  // -----------------------------
  public publicUserRegister = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const body = request.body as PublicUserRegisterDto;
      const { cookie, user, token } = await this.auth.publicUserRegister(body);

      response.setHeader('Set-Cookie', [cookie]);
      response.status(201).json({
        success: true,
        message: 'Registered successfully',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // PUBLIC USER — Email + password login
  // -----------------------------
  public publicUserLogin = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const body = request.body as PublicUserLoginDto;
      const { cookie, user, token } = await this.auth.publicUserLogin(body);

      response.setHeader('Set-Cookie', [cookie]);
      response.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // PUBLIC USER — Logout (Redis session removed)
  // -----------------------------
  public publicUserLogOut = async (request: RequestWithPublicUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const session_id = request.session_id;

      let token: string | undefined;
      const cookieToken = request.cookies?.['PublicAuthorization'];
      if (cookieToken) {
        token = cookieToken;
      } else {
        const headerToken = request.header('Authorization');
        if (headerToken?.startsWith('Bearer ')) {
          token = headerToken.split('Bearer ')[1];
        }
      }

      await this.auth.publicUserLogout(token, session_id);

      const isProduction = process.env.NODE_ENV === 'production';
      response.setHeader('Set-Cookie', [
        `PublicAuthorization=; HttpOnly; Max-Age=0; Path=/; SameSite=${isProduction ? 'None' : 'Lax'}${isProduction ? '; Secure' : ''}`,
      ]);

      response.status(200).json({
        success: true,
        message: 'Logout successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
