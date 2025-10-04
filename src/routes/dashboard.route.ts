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
    this.router.get(`${this.path}/stats`,this.dashboardController.getShopDashboardStats);
  }
}