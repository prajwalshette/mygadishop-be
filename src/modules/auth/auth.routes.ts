import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { AdminAuthMiddleware } from '@/middlewares/adminAuth.middleware';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { OnboardAuthMiddleware } from '@/middlewares/onboard.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { onboardShopSchema } from './auth.validator';
import { addAdminUserSchema } from '@modules/admin/admin.validator';
import { loginSchema } from './auth.validator';
import { AuthController } from './auth.controller';

export class AuthRoute implements Routes {
  public path = '/auth';
  public router: Router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Admin routes
    this.router.post(`${this.path}/admin-login`, ValidationMiddleware(loginSchema, 'body'), this.auth.adminLogIn);
    this.router.post(`${this.path}/add-admin-user`, ValidationMiddleware(addAdminUserSchema, 'body'), this.auth.addAdminUser);
    this.router.post(`${this.path}/admin-logout`, [AdminAuthMiddleware], this.auth.adminLogOut);

    // Shop user routes
    this.router.post(`${this.path}/logout`, [AuthMiddleware], this.auth.logOut);

    // UNIFIED LOGIN - Handles both login and signup
    this.router.post(`${this.path}/login`, ValidationMiddleware(loginSchema, 'body'), this.auth.login);
    this.router.post(`${this.path}/shop-onboard`, [OnboardAuthMiddleware, ValidationMiddleware(onboardShopSchema, 'body')], this.auth.onboardShop);
  }
}
