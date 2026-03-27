import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import type { GetAllShopsQueryDto, UpdateShopDto } from './shop.validator';
import { ShopService } from './shop.service';

export class ShopController {
  public shopService = Container.get(ShopService);

  public editShopDetails = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const shopData: UpdateShopDto = request.body;

      const shop = await this.shopService.editShopDetails(shopData, shop_id);
      response.status(200).json({ data: shop, message: 'Shop Details Update Successfully.' });
    } catch (error) {
      next(error);
    }
  };

  public getShopDetails = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const shop = await this.shopService.getShopDetails(shop_id);
      response.status(200).json({ data: shop, message: 'Shop Details Featch Successfully.' });
    } catch (error) {
      next(error);
    }
  };

  public getAllShop = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetAllShopsQueryDto = request.query as any;
      const shops = await this.shopService.getAllShop(query);

      response.status(200).json({ data: { ...shops }, message: 'Successfully Retrieved Shop' });
    } catch (error) {
      next(error);
    }
  };

}