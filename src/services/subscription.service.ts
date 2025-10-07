import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';
import { ISubscriptionPlan, SubscriptionPlanName } from '@/interfaces/subscription.interface';

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
      return {...newPlan, plan_name: newPlan.plan_name as SubscriptionPlanName};
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

}