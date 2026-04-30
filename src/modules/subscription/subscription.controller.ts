import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import { SubscriptionService } from './subscription.service';
import {
  GetSubscriptionHistoryQueryDto,
  GetPaymentHistoryQueryDto,
  CreateSubscriptionOrderDto,
} from './subscription.validator';
import crypto from 'crypto';
import { UnauthorizedException } from '@/exceptions';
import { logger } from '@/utils/logger';
import { RAZORPAY_WEBHOOK_SECRET } from '@/config/env';

export class SubscriptionController {
  public subscriptionService = Container.get(SubscriptionService);

  // -----------------------------
  // GET CURRENT SUBSCRIPTION - Retrieve shop current subscription
  // -----------------------------
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

  // -----------------------------
  // GET SUBSCRIPTION HISTORY - Retrieve shop subscription history
  // -----------------------------
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

  // -----------------------------
  // GET PAYMENT HISTORY - Retrieve shop subscription payment history
  // -----------------------------
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

  // -----------------------------
  // CREATE SUBSCRIPTION ORDER - Create Razorpay order for subscription
  // -----------------------------
  public createSubscriptionOrder = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id || request.user.shop_id;
      if (!shop_id) {
        response.status(400).json({ message: 'Shop ID not found' });
        return;
      }

      const body: CreateSubscriptionOrderDto = request.body;
      const order = await this.subscriptionService.createSubscriptionOrder(shop_id, body);
      response.status(200).json({ data: order, message: 'Subscription payment order created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET SUBSCRIPTION PLANS - Retrieve all subscription plans
  // -----------------------------
  public getSubscriptionPlans = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await this.subscriptionService.getSubscriptionPlans();
      response.status(200).json({ data: plans, message: 'Subscription plans fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // RAZORPAY WEBHOOK - Handle subscription webhook events
  // -----------------------------
  public handleRazorpayWebhook = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      if (!RAZORPAY_WEBHOOK_SECRET) {
        logger.error('Razorpay webhook secret not configured');
        throw new UnauthorizedException('Invalid webhook configuration');
      }

      const signature = request.headers['x-razorpay-signature'] as string | undefined;
      if (!signature) {
        throw new UnauthorizedException('Razorpay signature missing');
      }

      const bodyString = JSON.stringify(request.body);
      const shasum = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET);
      shasum.update(bodyString);
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        logger.warn('Razorpay webhook signature verification failed');
        throw new UnauthorizedException('Invalid Razorpay signature');
      }

      const { event, payload } = request.body as { event: string; payload: any };
      await this.subscriptionService.processRazorpayWebhook(event, payload);

      response.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}
