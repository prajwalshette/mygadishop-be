import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { ShopService } from '@/services/shop.service';
import { IShop } from '@/interfaces/shop.interface';

export class ShopController {
  public shopService = Container.get(ShopService);

  public editShopDetails = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const shopData: IShop = request.body;

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

}