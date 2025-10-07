import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@interfaces/auth.interface';
import { DashboardService } from '@/services/dashboard.service';

export class DashboardController {
  private dashboardService = Container.get(DashboardService);

  public getShopDashboardStats = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getShopDashboardStats();
      response.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}