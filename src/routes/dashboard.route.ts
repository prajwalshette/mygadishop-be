import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';
import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';

export class DashboardRoute implements Routes {
  public path = '/dashboard';
  public router = Router();
  private dashboardController = new DashboardController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/stats`,
      [AuthMiddleware],
      this.dashboardController.getShopDashboardStats
    );

    this.router.get(
      `${this.path}/analytics/sales-trend`,
      [AuthMiddleware],
      this.dashboardController.getSalesTrend
    );
    this.router.get(
      `${this.path}/analytics/revenue-by-vehicle-type`,
      [AuthMiddleware],
      this.dashboardController.getRevenueByVehicleType
    );
    this.router.get(
      `${this.path}/analytics/top-selling-brands`,
      [AuthMiddleware],
      this.dashboardController.getTopSellingBrands
    );
    this.router.get(
      `${this.path}/analytics/payment-method-distribution`,
      [AuthMiddleware],
      this.dashboardController.getPaymentMethodDistribution
    );
  }
}