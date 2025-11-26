import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithAdminUser, RequestWithUser } from '@/interfaces/auth.interface';
import { SubscriptionService } from '@/services/subscription.service';
import { ISubscriptionPricing } from '@/interfaces/subscription.interface';
import { CreateSubscriptionPlanDto, CreateSubscriptionPricingDto, ActiveDeactivePlanDto, GetSubscriptionHistoryQueryDto, GetPaymentHistoryQueryDto } from '@/schemas/subscription.schema';

export class SubscriptionController {
  public subscriptionService = Container.get(SubscriptionService);

  public createSubscriptionPlan = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const planData: CreateSubscriptionPlanDto = request.body;

      const plan = await this.subscriptionService.createSubscriptionPlan(planData);
      response.status(200).json({ data: plan, message: 'Successfully Create New Plan' });
    } catch (error) {
      next(error);
    }
  };

  public updateSubscriptionPlan = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = request.params.plan_id;
      const planData: CreateSubscriptionPlanDto = request.body;

      const plan = await this.subscriptionService.updateSubscriptionPlan(planData, plan_id);
      response.status(200).json({ data: plan, message: 'Successfully Update Plan' });
    } catch (error) {
      next(error);
    }
  };


  public getSubscriptionPlan = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await this.subscriptionService.getSubscriptionPlan();
      response.status(200).json({ data: plan, message: 'Plan Featch Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public createSubscriptionPricing = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = request.params.plan_id;
      const pricingData: CreateSubscriptionPricingDto = request.body;
      const pricing = await this.subscriptionService.createSubscriptionPricing({...pricingData, plan_id, id: '', is_active: true});
      response.status(200).json({ data: pricing, message: 'Successfully Create Pricing' });
    } catch (error) {
      next(error);
    }
  };

  public updateSubscriptionPricing = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = request.params.plan_id;
      const subscription_pricing_id = request.params.subscription_pricing_id;
      const pricingData: CreateSubscriptionPricingDto = request.body;
      const pricing = await this.subscriptionService.updateSubscriptionPricing({...pricingData, plan_id, id: '', is_active: true}, subscription_pricing_id);
      response.status(200).json({ data: pricing, message: 'Successfully Update Pricing' });
    } catch (error) {
      next(error);
    }
  };

  public activeDeactiveSubscriptionPlan = async (request: RequestWithAdminUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = request.params.plan_id;
      const { is_active }: ActiveDeactivePlanDto = request.body;
      await this.subscriptionService.activeDeactiveSubscriptionPlan(plan_id, is_active);
      response.status(200).json({ message: is_active ? 'Successfully active subscription plan' : 'Successfully deactive subscription plan' });
    } catch (error) {
      next(error);
    }
  };

  // Get shop current subscription (for shop users)
  public getShopCurrentSubscription = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id || request.user.shop_id;
      if (!shop_id) {
        response.status(400).json({ message: 'Shop ID not found' });
        return;
      }
      const subscription = await this.subscriptionService.getShopCurrentSubscription(shop_id);
      response.status(200).json({ data: subscription, message: 'Shop subscription fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Get shop subscription history (for shop users)
  public getShopSubscriptionHistory = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id || request.user.shop_id;
      if (!shop_id) {
        response.status(400).json({ message: 'Shop ID not found' });
        return;
      }
      const query: GetSubscriptionHistoryQueryDto = request.query as any;
      const history = await this.subscriptionService.getShopSubscriptionHistory(shop_id, query);
      response.status(200).json({ data: history, message: 'Subscription history fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Get shop payment history (for shop users)
  public getShopPaymentHistory = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id || request.user.shop_id;
      if (!shop_id) {
        response.status(400).json({ message: 'Shop ID not found' });
        return;
      }
      const query: GetPaymentHistoryQueryDto = request.query as any;
      const history = await this.subscriptionService.getShopPaymentHistory(shop_id, query);
      response.status(200).json({ data: history, message: 'Payment history fetched successfully' });
    } catch (error) {
      next(error);
    }
  };
}
