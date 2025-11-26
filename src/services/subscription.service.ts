import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import prisma from '@/database';
import { ulid } from 'ulid';
import { ISubscriptionPlan, ISubscriptionPricing, PlanDuration, SubscriptionPlanName, SubscriptionStatus } from '@/interfaces/subscription.interface';
import { CreateSubscriptionPlanDto, CreateSubscriptionPricingDto } from '@/schemas/subscription.schema';
import { logger } from '@utils/logger';

@Service()
export class SubscriptionService {
  private prisma = prisma;

  // -----------------------------
  // CREATE SUBSCRIPTION PLAN - Add new subscription plan
  // -----------------------------
  public async createSubscriptionPlan(planData: CreateSubscriptionPlanDto): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { plan_name: planData.plan_name },
      });

      if (isExistPlan) {
        logger.warn(`Create plan failed: Plan already exists - ${planData.plan_name}`);
        throw new ConflictException(`${planData.plan_name} Plan already exists`);
      }
      
      const newPlan = await this.prisma.subscriptionPlan.create({
        data: {
          id: ulid(),
          ...planData,
        },
      });
      
      logger.info(`Subscription plan created successfully: ${newPlan.plan_name} (${newPlan.id})`);
      return { ...newPlan, plan_name: newPlan.plan_name as SubscriptionPlanName };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create subscription plan error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE SUBSCRIPTION PLAN - Modify existing plan
  // -----------------------------
  public async updateSubscriptionPlan(planData: CreateSubscriptionPlanDto, plan_id: string): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
      });

      if (!isExistPlan) {
        logger.warn(`Update plan failed: Plan not found - ${plan_id}`);
        throw new NotFoundException('Plan not found');
      }
      
      const plan = await this.prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          plan_name: planData.plan_name,
          description: planData.description,
          max_vehicles: planData.max_vehicles,
          max_staff_users: planData.max_staff_users,
        },
      });
      
      logger.info(`Subscription plan updated successfully: ${plan.plan_name} (${plan_id})`);
      return { ...plan, plan_name: plan.plan_name as SubscriptionPlanName };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update subscription plan error for ${plan_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SUBSCRIPTION PLANS - Retrieve all active plans
  // -----------------------------
  public async getSubscriptionPlan(): Promise<any> {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { is_active: true },
        include: {
          pricing: true,
        },
      });
      
      logger.info(`Retrieved ${plans.length} subscription plans`);
      return plans;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get subscription plans error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // CREATE SUBSCRIPTION PRICING - Add pricing for a plan
  // -----------------------------
  public async createSubscriptionPricing(pricingData: ISubscriptionPricing): Promise<ISubscriptionPricing> {
    try {
      const isExistPricing = await this.prisma.subscriptionPricing.findFirst({
        where: { plan_id: pricingData.plan_id, duration: pricingData.duration },
      });

      if (isExistPricing) {
        logger.warn(`Create pricing failed: Pricing already exists for plan ${pricingData.plan_id} with duration ${pricingData.duration}`);
        throw new ConflictException(`Pricing already exists in this plan for duration ${pricingData.duration}`);
      }
      
      const newPricing = await this.prisma.subscriptionPricing.create({
        data: {
          id: ulid(),
          ...pricingData,
        },
      });
      
      logger.info(`Subscription pricing created successfully: ${newPricing.duration} (${newPricing.id})`);
      return { ...newPricing, duration: newPricing.duration as PlanDuration };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create subscription pricing error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE SUBSCRIPTION PRICING - Modify existing pricing
  // -----------------------------
  public async updateSubscriptionPricing(pricingData: ISubscriptionPricing, subscription_pricing_id: string): Promise<ISubscriptionPricing> {
    try {
      const isExistPricing = await this.prisma.subscriptionPricing.findFirst({
        where: { plan_id: pricingData.plan_id, id: subscription_pricing_id },
      });

      if (!isExistPricing) {
        logger.warn(`Update pricing failed: Pricing not found - ${subscription_pricing_id}`);
        throw new NotFoundException('Pricing not found');
      }

      const pricing = await this.prisma.subscriptionPricing.update({
        where: { id: subscription_pricing_id },
        data: {
          duration: pricingData.duration,
          price: pricingData.price,
          discount: pricingData.discount,
        },
      });
      
      logger.info(`Subscription pricing updated successfully: ${pricing.duration} (${subscription_pricing_id})`);
      return { ...pricing, duration: pricing.duration as PlanDuration };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update subscription pricing error for ${subscription_pricing_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // ACTIVE/DEACTIVE SUBSCRIPTION PLAN - Toggle plan status
  // -----------------------------
  public async activeDeactiveSubscriptionPlan(plan_id: string, is_active: boolean): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
      });

      if (!isExistPlan) {
        logger.warn(`Toggle plan status failed: Plan not found - ${plan_id}`);
        throw new NotFoundException('Plan not found');
      }
      
      const plan = await this.prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          is_active: is_active,
        },
      });

      await this.prisma.subscriptionPricing.updateMany({
        where: { plan_id: plan_id },
        data: {
          is_active: is_active,
        },
      });

      logger.info(`Subscription plan ${is_active ? 'activated' : 'deactivated'} successfully: ${plan.plan_name} (${plan_id})`);
      return { ...plan, plan_name: plan.plan_name as SubscriptionPlanName };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Toggle plan status error for ${plan_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SHOP CURRENT SUBSCRIPTION - Get active subscription for a shop
  // -----------------------------
  public async getShopCurrentSubscription(shop_id: string): Promise<any> {
    try {
      const shop = await this.prisma.shop.findUnique({ where: { id: shop_id } });
      if (!shop) {
        logger.warn(`Get shop subscription failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

      // Get the most recent active subscription
      const subscription = await this.prisma.shopSubscription.findFirst({
        where: { 
          shop_id: shop_id,
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAYMENT_PENDING]
          }
        },
        orderBy: { created_at: 'desc' },
        include: {
          plan: {
            select: {
              id: true,
              plan_name: true,
              description: true,
              max_vehicles: true,
              max_staff_users: true,
            }
          },
          pricing: {
            select: {
              id: true,
              duration: true,
              price: true,
              discount: true,
            }
          }
        }
      });

      // If no active subscription, check shop's subscription_status
      if (!subscription) {
        return {
          shop: {
            id: shop.id,
            shop_name: shop.shop_name,
            subscription_status: shop.subscription_status,
            subscription_plan: shop.subscription_plan,
            plan_start_date: shop.plan_start_date,
            plan_end_date: shop.plan_end_date,
          },
          subscription: null,
          plan: null,
          pricing: null,
        };
      }

      logger.info(`Retrieved current subscription for shop ${shop_id}`);
      return {
        shop: {
          id: shop.id,
          shop_name: shop.shop_name,
          subscription_status: shop.subscription_status,
        },
        subscription: {
          ...subscription,
          status: subscription.status,
        },
        plan: subscription.plan,
        pricing: subscription.pricing,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop subscription error for ${shop_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SHOP SUBSCRIPTION HISTORY - Get all subscriptions for a shop
  // -----------------------------
  public async getShopSubscriptionHistory(shop_id: string, query: { page?: number; limit?: number }): Promise<any> {
    try {
      const shop = await this.prisma.shop.findUnique({ where: { id: shop_id } });
      if (!shop) {
        logger.warn(`Get shop subscription history failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const [subscriptions, total] = await Promise.all([
        this.prisma.shopSubscription.findMany({
          where: { shop_id: shop_id },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            plan: {
              select: {
                id: true,
                plan_name: true,
                description: true,
              }
            },
            pricing: {
              select: {
                id: true,
                duration: true,
                price: true,
                discount: true,
              }
            }
          }
        }),
        this.prisma.shopSubscription.count({ where: { shop_id: shop_id } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${subscriptions.length} subscriptions for shop ${shop_id}`);
      return {
        subscriptions: subscriptions.map(sub => ({
          ...sub,
          status: sub.status,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop subscription history error for ${shop_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SHOP PAYMENT HISTORY - Get transaction history for subscriptions
  // -----------------------------
  public async getShopPaymentHistory(shop_id: string, query: { page?: number; limit?: number; status?: string }): Promise<any> {
    try {
      const shop = await this.prisma.shop.findUnique({ where: { id: shop_id } });
      if (!shop) {
        logger.warn(`Get shop payment history failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

      const { page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        shop_id: shop_id,
        subscription_id: { not: null }, // Only subscription-related transactions
      };

      if (status) {
        whereClause.status = status;
      }

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            subscription: {
              include: {
                plan: {
                  select: {
                    plan_name: true,
                    description: true,
                  }
                }
              }
            }
          }
        }),
        this.prisma.transaction.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${transactions.length} payment transactions for shop ${shop_id}`);
      return {
        transactions: transactions.map(txn => ({
          ...txn,
          status: txn.status,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop payment history error for ${shop_id}: ${error.message}`);
      throw error;
    }
  }
}
