import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { AdminAuthMiddleware } from '@middlewares/adminAuth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { OnboardAuthMiddleware } from '@middlewares/onboard.middleware';
import { loginSchema } from '@/validator/auth.validator';
import { addAdminUserSchema } from '@/validator/admin.validator';
import { onboardShopSchema } from '@/validator/onboard.validator';

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
