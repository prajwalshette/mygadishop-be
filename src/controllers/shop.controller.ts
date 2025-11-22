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

  public getAllShop = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { page_number, page_size } = request.query;

      const pageNumber = page_number ? Number(page_number) : 1;
      const pageSize = page_size ? Number(page_size) : 5;
      const shops = await this.shopService.getAllShop(pageNumber, pageSize);

      response.status(200).json({ data: { ...shops }, message: 'Successfully Retrieved Shop' });
    } catch (error) {
      next(error);
    }
  };

}