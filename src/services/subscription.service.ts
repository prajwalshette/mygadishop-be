import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import prisma from '@/database';
import { ulid } from 'ulid';
import { ISubscriptionPlan, ISubscriptionPricing, PlanDuration, SubscriptionPlanName } from '@/interfaces/subscription.interface';
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
}
