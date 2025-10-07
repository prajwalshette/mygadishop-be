import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { formatPrismaError } from '@/exceptions/prismaException';
import { IShop, ShopType } from '@/interfaces/shop.interface';
import { SubscriptionPlanName, SubscriptionStatus } from '@/interfaces/subscription.interface';

@Service()
export class ShopService {
  private prisma = prisma;

  public async editShopDetails(shopData: IShop, shop_id: string): Promise<IShop> {
    try {
      const shop = await this.prisma.shop.findFirst({
        where: { id: shop_id, is_deleted: false, is_active: true },
      });

      if (!shop) {
        throw new HttpException(404, 'Shop not found');
      }
      const updatedShop = await this.prisma.shop.update({
        where: { id: shop_id },
        data: shopData,
      });

      return {
        ...updatedShop,
        subscription_plan: updatedShop.subscription_plan as SubscriptionPlanName,
        subscription_status: updatedShop.subscription_status as SubscriptionStatus,
        shop_type: updatedShop.shop_type as ShopType,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) throw formatPrismaError(error);
      throw new HttpException(500, `Error Edit Shop Details: ${error.message}`);
    }
  }

  public async getShopDetails(shop_id: string): Promise<IShop> {
    try {
      const shop = await this.prisma.shop.findFirst({
        where: { id: shop_id, is_deleted: false, is_active: true },
      });

      if (!shop) {
        throw new HttpException(404, 'Shop not found');
      }

      return {
        ...shop,
        subscription_plan: shop.subscription_plan as SubscriptionPlanName,
        subscription_status: shop.subscription_status as SubscriptionStatus,
        shop_type: shop.shop_type as ShopType,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) throw formatPrismaError(error);
      throw new HttpException(500, `Error Edit Shop Details: ${error.message}`);
    }
  }
}
