import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { AdminAuthMiddleware } from '@/middlewares/adminAuth.middleware';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { OnboardAuthMiddleware } from '@/middlewares/onboard.middleware';
import { PublicUserAuthMiddleware } from '@/middlewares/publicUserAuth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { addAdminUserSchema } from '../admin/admin.validator';
import { onboardShopSchema, publicUserLoginSchema, publicUserRegisterSchema, loginSchema } from './auth.validator';
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

    // Public user (Redis-backed session, 24h)
    this.router.post(`${this.path}/public/register`, ValidationMiddleware(publicUserRegisterSchema, 'body'), this.auth.publicUserRegister);
    this.router.post(`${this.path}/public/login`, ValidationMiddleware(publicUserLoginSchema, 'body'), this.auth.publicUserLogin);
    this.router.post(`${this.path}/public/logout`, [PublicUserAuthMiddleware], this.auth.publicUserLogOut);
  }
}
