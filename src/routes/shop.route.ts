import { Router } from 'express';
import { ShopController } from '@/controllers/shop.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { UpdateShopDto } from '@/dtos/shop.dto';

export class ShopRoute implements Routes {
  public path = '/shop';
  public router = Router();
  public shopController = new ShopController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.put(`${this.path}/update-details`, [AuthMiddleware, ValidationMiddleware(UpdateShopDto)], this.shopController.editShopDetails);
    this.router.get(`${this.path}/details`, [AuthMiddleware], this.shopController.getShopDetails);
}
}
