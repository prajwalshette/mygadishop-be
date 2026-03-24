import { Router } from 'express';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import {
  getSubscriptionHistoryQuerySchema,
  getPaymentHistoryQuerySchema,
  createSubscriptionOrderSchema,
} from '@/schemas/subscription.schema';

export class SubscriptionRoute implements Routes {
  public path = '/subscription';
  public router: Router = Router();
  public subscriptionController = new SubscriptionController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get all subscription plans (public endpoint for shop users)
    this.router.get(`${this.path}/plans`, this.subscriptionController.getSubscriptionPlans);

    // Shop subscription routes (for shop users)
    this.router.get(`${this.path}/shop/current`, [AuthMiddleware], this.subscriptionController.getShopCurrentSubscription);
    this.router.get(`${this.path}/shop/history`, [AuthMiddleware, ValidationMiddleware(getSubscriptionHistoryQuerySchema, 'query')], this.subscriptionController.getShopSubscriptionHistory);
    this.router.get(`${this.path}/shop/payment-history`, [AuthMiddleware, ValidationMiddleware(getPaymentHistoryQuerySchema, 'query')], this.subscriptionController.getShopPaymentHistory);

    // Razorpay payment routes
    this.router.post(
      `${this.path}/shop/create-order`,
      [AuthMiddleware, ValidationMiddleware(createSubscriptionOrderSchema, 'body')],
      this.subscriptionController.createSubscriptionOrder,
    );
    this.router.post(`${this.path}/razorpay/webhook`, this.subscriptionController.handleRazorpayWebhook);
  }
}
