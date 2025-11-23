import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { Routes } from '@interfaces/routes.interface';
import { AdminAuthMiddleware } from '@/middlewares/adminAuth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import {
  updateShopStatusSchema,
  updateUserStatusSchema,
  ShopIdParamSchema,
  UserIdParamSchema,
  getShopQuerySchema,
  getUserQuerySchema,
  createShopSchema,
  updateShopStatusEnhancedSchema,
  getShopVehiclesQuerySchema,
  getShopCustomersQuerySchema,
  getShopPaymentHistoryQuerySchema,
  getShopQueryEnhancedSchema,
  getAnalyticsQuerySchema,
} from '@/schemas/admin.schema';

export class AdminRoute implements Routes {
  public path = '/admin';
  public router = Router();
  public adminController = new AdminController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Dashboard
    this.router.get(`${this.path}/dashboard-stats`, AdminAuthMiddleware, this.adminController.getDashboardStats);
    
    // Analytics
    this.router.get(
      `${this.path}/analytics`,
      [AdminAuthMiddleware, ValidationMiddleware(getAnalyticsQuerySchema, 'query')],
      this.adminController.getAnalytics
    );
    
    // Current Admin (for session validation)
    this.router.get(`${this.path}/me`, AdminAuthMiddleware, this.adminController.getCurrentAdmin);

    // Shops
    this.router.get(`${this.path}/shops`, [AdminAuthMiddleware, ValidationMiddleware(getShopQueryEnhancedSchema, 'query')], this.adminController.getShopsEnhanced);
    this.router.post(`${this.path}/shops`, [AdminAuthMiddleware, ValidationMiddleware(createShopSchema, 'body')], this.adminController.createShop);
    this.router.get(`${this.path}/shops/:id`, [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params')], this.adminController.getShop);
    this.router.put(
      `${this.path}/shops/:id/status`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params'), ValidationMiddleware(updateShopStatusSchema, 'body')],
      this.adminController.updateShopStatus,
    );
    this.router.put(
      `${this.path}/shops/:id/status-enhanced`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params'), ValidationMiddleware(updateShopStatusEnhancedSchema, 'body')],
      this.adminController.updateShopStatusEnhanced,
    );
    this.router.get(
      `${this.path}/shops/:id/statistics`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params')],
      this.adminController.getShopStatistics,
    );
    this.router.get(
      `${this.path}/shops/:id/vehicles`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params'), ValidationMiddleware(getShopVehiclesQuerySchema, 'query')],
      this.adminController.getShopVehicles,
    );
    this.router.get(
      `${this.path}/shops/:id/customers`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params'), ValidationMiddleware(getShopCustomersQuerySchema, 'query')],
      this.adminController.getShopCustomers,
    );
    this.router.get(
      `${this.path}/shops/:id/payments`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params'), ValidationMiddleware(getShopPaymentHistoryQuerySchema, 'query')],
      this.adminController.getShopPaymentHistory,
    );
    this.router.delete(
      `${this.path}/shops/:id`,
      [AdminAuthMiddleware, ValidationMiddleware(ShopIdParamSchema, 'params')],
      this.adminController.deleteShop,
    );

    // Users
    this.router.get(`${this.path}/users`, [AdminAuthMiddleware, ValidationMiddleware(getUserQuerySchema, 'query')], this.adminController.getUsers);
    this.router.get(`${this.path}/users/:id`, [AdminAuthMiddleware, ValidationMiddleware(UserIdParamSchema, 'params')], this.adminController.getUser);
    this.router.put(
      `${this.path}/users/:id/status`,
      [AdminAuthMiddleware, ValidationMiddleware(UserIdParamSchema, 'params'), ValidationMiddleware(updateUserStatusSchema, 'body')],
      this.adminController.updateUserStatus,
    );
    this.router.delete(
      `${this.path}/users/:id`,
      [AdminAuthMiddleware, ValidationMiddleware(UserIdParamSchema, 'params')],
      this.adminController.deleteUser,
    );
  }
}
