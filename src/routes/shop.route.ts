import { Router } from 'express';
import { ShopController } from '@/controllers/shop.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { updateShopSchema, getAllShopsQuerySchema } from '@/schemas/shop.schema';
import { AdminAuthMiddleware } from '@/middlewares/adminAuth.middleware';

export class ShopRoute implements Routes {
  public path = '/shop';
  public router: Router = Router();
  public shopController = new ShopController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.put(`${this.path}/update-details`, [AuthMiddleware, ValidationMiddleware(updateShopSchema, 'body')], this.shopController.editShopDetails);
    this.router.get(`${this.path}/details`, [AuthMiddleware], this.shopController.getShopDetails);


    //Admin Routes can be added here in future
    this.router.get(`${this.path}/get-all`, [AdminAuthMiddleware, ValidationMiddleware(getAllShopsQuerySchema, 'query')], this.shopController.getAllShop);
}
}
