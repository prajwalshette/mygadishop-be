import { Router } from 'express';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { AdminAuthMiddleware } from '@/middlewares/adminAuth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { 
  createSubscriptionPlanSchema, 
  createSubscriptionPricingSchema,
  planIdParamSchema,
  pricingIdParamSchema,
  activeDeactivePlanSchema
} from '@/schemas/subscription.schema';

export class SubscriptionRoute implements Routes {
  public path = '/subscription';
  public router = Router();
  public subscriptionController = new SubscriptionController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create-plan`, [AdminAuthMiddleware, ValidationMiddleware(createSubscriptionPlanSchema, 'body')], this.subscriptionController.createSubscriptionPlan);
    this.router.put(`${this.path}/:plan_id/update-plan`, [AdminAuthMiddleware, ValidationMiddleware(planIdParamSchema, 'params'), ValidationMiddleware(createSubscriptionPlanSchema, 'body')], this.subscriptionController.updateSubscriptionPlan);
    this.router.get(`${this.path}/plans`, [AdminAuthMiddleware], this.subscriptionController.getSubscriptionPlan);
    this.router.post(`${this.path}/:plan_id/create-pricing`, [AdminAuthMiddleware, ValidationMiddleware(planIdParamSchema, 'params'), ValidationMiddleware(createSubscriptionPricingSchema, 'body')], this.subscriptionController.createSubscriptionPricing);
    this.router.put(`${this.path}/:plan_id/:subscription_pricing_id/update-pricing`, [AdminAuthMiddleware, ValidationMiddleware(pricingIdParamSchema, 'params'), ValidationMiddleware(createSubscriptionPricingSchema, 'body')], this.subscriptionController.updateSubscriptionPricing);
    this.router.put(`${this.path}/:plan_id/active-deactive-plan`, [AdminAuthMiddleware, ValidationMiddleware(planIdParamSchema, 'params'), ValidationMiddleware(activeDeactivePlanSchema, 'body')], this.subscriptionController.activeDeactiveSubscriptionPlan);

    // this.router.put(`${this.path}/:subscription_id/assign-shop`, [AdminAuthMiddleware], this.subscriptionController.assignSubscriptionToShop);
  }
}
