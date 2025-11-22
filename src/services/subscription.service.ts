import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';
import { ISubscriptionPlan, ISubscriptionPricing, PlanDuration, SubscriptionPlanName } from '@/interfaces/subscription.interface';

@Service()
export class SubscriptionService {
  private prisma = prisma;

  public async createSubscriptionPlan(planData: ISubscriptionPlan): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { plan_name: planData.plan_name },
      });

      if (isExistPlan) {
        throw new HttpException(404, `${planData.plan_name} Plan already exists`);
      }
      const newPlan = await this.prisma.subscriptionPlan.create({
        data: {
          id: ulid(),
          ...planData,
        },
      });
      return { ...newPlan, plan_name: newPlan.plan_name as SubscriptionPlanName };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Add New Subscription Plan: ${error.message}`);
    }
  }

  public async updateSubscriptionPlan(planData: ISubscriptionPlan, plan_id: string): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
      });

      if (!isExistPlan) {
        throw new HttpException(404, `plan not found`);
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
      return { ...plan, plan_name: plan.plan_name as SubscriptionPlanName };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Update Subscription Plan: ${error.message}`);
    }
  }

  public async getSubscriptionPlan(): Promise<any> {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { is_active: true },
        include: {
          pricing: true,
        },
      });
      return plans;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Featch  Subscription Plan: ${error.message}`);
    }
  }

  public async createSubscriptionPricing(pricingData: ISubscriptionPricing): Promise<ISubscriptionPricing> {
    try {
      const isExistPlan = await this.prisma.subscriptionPricing.findFirst({
        where: { plan_id: pricingData.plan_id, duration: pricingData.duration },
      });

      if (isExistPlan) {
        throw new HttpException(404, `Pricing already exists in this plan for duration ${pricingData.duration} months`);
      }
      const newPricing = await this.prisma.subscriptionPricing.create({
        data: {
          id: ulid(),
          ...pricingData,
        },
      });
      return { ...newPricing, duration: newPricing.duration as PlanDuration };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Add New Subscription Plan Pricing: ${error.message}`);
    }
  }

  public async updateSubscriptionPricing(pricingData: ISubscriptionPricing, subscription_pricing_id: string): Promise<ISubscriptionPricing> {
    try {
      const isExistPricing = await this.prisma.subscriptionPricing.findFirst({
        where: { plan_id: pricingData.plan_id, id: subscription_pricing_id },
      });

      if (!isExistPricing) {
        throw new HttpException(404, `Pricing not found`);
      }

      const pricing = await this.prisma.subscriptionPricing.update({
        where: { id: subscription_pricing_id },
        data: {
          duration: pricingData.duration,
          price: pricingData.price,
          discount: pricingData.discount,
        },
      });
      return { ...pricing, duration: pricing.duration as PlanDuration };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Update Subscription Plan Pricing: ${error.message}`);
    }
  };

  public async activeDeactiveSubscriptionPlan(plan_id: string, is_active: boolean): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
      });

      if (!isExistPlan) {
        throw new HttpException(404, `plan not found`);
      }
      const plan = await this.prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          is_active: is_active ? true : false,
        },
      });

      await this.prisma.subscriptionPricing.updateMany({
        where: { plan_id: plan_id },
        data: {
          is_active: is_active ? true : false,
        },
      });

      return { ...plan, plan_name: plan.plan_name as SubscriptionPlanName };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error update plan status: ${error.message}`);
    }
  } 
}
