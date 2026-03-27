import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException, NotFoundException } from '@/exceptions';
import prisma from '@/lib/prisma';
import type { IShop, ShopType } from './shop.interface';
import type { SubscriptionPlanName, SubscriptionStatus } from '@prisma/client';
import type { GetAllShopsQueryDto, UpdateShopDto } from './shop.validator';
import { logger } from '@/utils/logger';

@Service()
export class ShopService {
  private prisma = prisma;

  // -----------------------------
  // EDIT SHOP DETAILS - Update shop information
  // -----------------------------
  public async editShopDetails(shopData: UpdateShopDto, shop_id: string): Promise<IShop> {
    try {
      const shop = await this.prisma.shop.findFirst({
        where: { id: shop_id, deleted_at: null, is_active: true },
      });

      if (!shop) {
        logger.warn(`Edit shop failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }
      
      const updatedShop = await this.prisma.shop.update({
        where: { id: shop_id },
        data: shopData,
      });

      logger.info(`Shop details updated successfully: ${updatedShop.shop_name} (${shop_id})`);
      return {
        ...updatedShop,
        subscription_plan: updatedShop.subscription_plan as SubscriptionPlanName,
        subscription_status: updatedShop.subscription_status as SubscriptionStatus,
        shop_type: updatedShop.shop_type as ShopType,
        deleted_at: updatedShop.deleted_at,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Edit shop details error for ${shop_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SHOP DETAILS - Retrieve shop information
  // -----------------------------
  public async getShopDetails(shop_id: string): Promise<IShop> {
    try {
      const shop = await this.prisma.shop.findFirst({
        where: { id: shop_id, deleted_at: null, is_active: true },
      });

      if (!shop) {
        logger.warn(`Get shop failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

      logger.info(`Shop details retrieved successfully: ${shop_id}`);
      return {
        ...shop,
        subscription_plan: shop.subscription_plan as SubscriptionPlanName,
        subscription_status: shop.subscription_status as SubscriptionStatus,
        shop_type: shop.shop_type as ShopType,
        deleted_at: shop.deleted_at,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop details error for ${shop_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET ALL SHOPS - Retrieve paginated shop list (Admin)
  // -----------------------------
  public async getAllShop(query: GetAllShopsQueryDto): Promise<any> {
    try {
      const { page, limit } = query;
      const skip = (page - 1) * limit;
      
      const shops = await this.prisma.shop.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      });

      const shopCount = await this.prisma.shop.count({
        where: { deleted_at: null },
      });

      logger.info(`Retrieved ${shopCount} shops (page ${page}, limit ${limit})`);
      return {
        shops: shops.map(shop => ({
          ...shop,
          subscription_plan: shop.subscription_plan as SubscriptionPlanName,
          subscription_status: shop.subscription_status as SubscriptionStatus,
          shop_type: shop.shop_type as ShopType,
          deleted_at: shop.deleted_at,
        })),
        pagination: {
          page: page,
          limit: limit,
          total: shopCount,
          totalPages: Math.ceil(shopCount / limit),
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get all shops error: ${error.message}`);
      throw error;
    }
  }
}
