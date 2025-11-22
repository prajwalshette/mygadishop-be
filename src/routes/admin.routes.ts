import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { Routes } from '@interfaces/routes.interface';

export class AdminRoute implements Routes {
  public path = '/admin';
  public router = Router();
  public adminController = new AdminController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.post(`${this.path}/admin-login`, ValidationMiddleware(LoginAdminUserDto), this.adminController.adminLogIn);
  }
}
