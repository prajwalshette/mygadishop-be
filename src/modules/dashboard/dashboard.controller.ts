import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  private dashboardService = Container.get(DashboardService);

  // -----------------------------
  // SHOP DASHBOARD STATS - Get dashboard KPIs for shop
  // -----------------------------
  public getShopDashboardStats = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const shop_id = request.user.shop_id;
      const stats = await this.dashboardService.getShopDashboardStats(shop_id);
      response.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard stats retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // SALES TREND - Get sales trend for shop
  // -----------------------------
  public getSalesTrend = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const shop_id = request.user.shop_id;
      const days = parseInt(request.query.days as string) || 30;
      const data = await this.dashboardService.getSalesTrend(shop_id, days);
      response.status(200).json({ success: true, data, message: 'Sales trend retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // REVENUE BY VEHICLE TYPE - Get revenue by vehicle type for shop
  // -----------------------------
  public getRevenueByVehicleType = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const shop_id = request.user.shop_id;
      const data = await this.dashboardService.getRevenueByVehicleType(shop_id);
      response.status(200).json({ success: true, data, message: 'Revenue by vehicle type retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // TOP SELLING BRANDS - Get top selling brands for shop
  // -----------------------------
  public getTopSellingBrands = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const shop_id = request.user.shop_id;
      const limit = parseInt(request.query.limit as string) || 10;
      const data = await this.dashboardService.getTopSellingBrands(shop_id, limit);
      response.status(200).json({ success: true, data, message: 'Top selling brands retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // PAYMENT METHOD DISTRIBUTION - Get payment method distribution for shop
  // -----------------------------
  public getPaymentMethodDistribution = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const shop_id = request.user.shop_id;
      const data = await this.dashboardService.getPaymentMethodDistribution(shop_id);
      response.status(200).json({ success: true, data, message: 'Payment method distribution retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };
}
