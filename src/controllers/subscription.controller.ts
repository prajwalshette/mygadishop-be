import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithAdminUser } from '@/interfaces/auth.interface';
import { SubscriptionService } from '@/services/subscription.service';
import { ISubscriptionPlan } from '@/interfaces/subscription.interface';

export class SubscriptionController {
  public subscriptionService = Container.get(SubscriptionService);

  public createSubscriptionPlan = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const planData: ISubscriptionPlan = request.body;

      const plan = await this.subscriptionService.createSubscriptionPlan(planData);
      response.status(200).json({ data: plan, message: 'Successfully Create New Plan' });
    } catch (error) {
      next(error);
    }
  };
}
