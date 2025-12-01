import { Prisma, TransactionStatus } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import prisma from '@/database';
import { ulid } from 'ulid';
import { PlanDuration, SubscriptionStatus, SubscriptionPlanName } from '@/interfaces/subscription.interface';
import { logger } from '@utils/logger';
import axios from 'axios';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '@/config';

@Service()
export class SubscriptionService {
  private prisma = prisma;

  // -----------------------------
  // GET SHOP CURRENT SUBSCRIPTION - Get active subscription for a shop
  // -----------------------------
  public async getShopCurrentSubscription(shop_id: string): Promise<any> {
    try {
      // Fetch shop and subscription in parallel for better performance
      const [shop, subscription] = await Promise.all([
        this.prisma.shop.findUnique({ 
          where: { id: shop_id },
          select: {
            id: true,
            shop_name: true,
            subscription_status: true,
            subscription_plan: true,
            plan_start_date: true,
            plan_end_date: true,
          }
        }),
        this.prisma.shopSubscription.findFirst({
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
        })
      ]);

      if (!shop) {
        logger.warn(`Get shop subscription failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

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
              select: {
                id: true,
                plan: {
                  select: {
                    plan_name: true,
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

  // -----------------------------
  // CREATE SUBSCRIPTION ORDER (RAZORPAY) - Create Razorpay order for selected plan
  // -----------------------------
  public async createSubscriptionOrder(shop_id: string, data: { plan_name: SubscriptionPlanName; duration: PlanDuration }): Promise<any> {
    try {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        logger.error('Razorpay configuration missing');
        throw new HttpException(500, 'Payment configuration not available');
      }

      const shop = await this.prisma.shop.findUnique({ where: { id: shop_id } });
      if (!shop) {
        logger.warn(`Create subscription order failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: { plan_name: data.plan_name, is_active: true },
        include: {
          pricing: {
            where: { duration: data.duration, is_active: true },
          },
        },
      });

      if (!plan) {
        logger.warn(`Create subscription order failed: Plan not found - ${data.plan_name}`);
        throw new NotFoundException('Subscription plan not found');
      }

      const pricing = plan.pricing[0];
      if (!pricing) {
        logger.warn(`Create subscription order failed: Pricing not found for duration ${data.duration} on plan ${data.plan_name}`);
        throw new NotFoundException('Subscription pricing not found for selected duration');
      }

      const discount = pricing.discount ?? 0;
      const basePrice = pricing.price;
      const finalAmount = basePrice - (basePrice * discount) / 100;
      const amountInPaise = Math.round(finalAmount * 100);

      // Validate amount (Razorpay minimum is ₹1 = 100 paise)
      if (amountInPaise < 100) {
        logger.error(`Create subscription order failed: Amount too small - ${amountInPaise} paise (₹${finalAmount})`);
        throw new HttpException(400, 'Amount must be at least ₹1');
      }

      const receipt = `sub_${shop_id.slice(-8)}_${Date.now()}`;

      const authString = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

      try {
        const razorpayOrderResponse = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            notes: {
              shop_id,
              plan_id: plan.id,
              subscription_pricing_id: pricing.id,
              duration: data.duration,
            },
          },
          {
            headers: {
              Authorization: `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const order = razorpayOrderResponse.data;

        await this.prisma.transaction.create({
          data: {
            id: ulid(),
            shop_id,
            subscription_id: null,
            amount: finalAmount,
            currency: 'INR',
            status: TransactionStatus.PENDING,
            payment_method: null,
            razorpay_order_id: order.id,
            razorpay_payment_id: null,
            razorpay_signature: null,
            receipt_number: receipt,
            invoice_url: null,
            description: `Subscription purchase - ${plan.plan_name} (${pricing.duration})`,
            notes: {
              shop_id,
              plan_id: plan.id,
              subscription_pricing_id: pricing.id,
              duration: data.duration,
            } as Prisma.JsonObject,
            failure_reason: null,
            payment_date: null,
          },
        });

        logger.info(`Razorpay order created successfully for shop ${shop_id} - order_id: ${order.id}`);

        return {
          order_id: order.id,
          amount: finalAmount,
          currency: 'INR',
          razorpay_key_id: RAZORPAY_KEY_ID,
          notes: order.notes,
        };
      } catch (razorpayError: any) {
        logger.error(`Razorpay API error: ${razorpayError.message}. Status: ${razorpayError.response?.status}, Amount: ${amountInPaise} paise, Receipt: ${receipt}, Response: ${JSON.stringify(razorpayError.response?.data)}`);
        
        if (razorpayError.response?.data) {
          const errorMessage = razorpayError.response.data.error?.description || razorpayError.response.data.error?.message || 'Razorpay API error';
          throw new HttpException(razorpayError.response.status || 400, errorMessage);
        }
        throw new HttpException(500, 'Failed to create Razorpay order');
      }
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create subscription order error for shop ${shop_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // PROCESS RAZORPAY WEBHOOK - Update transaction & create subscription
  // -----------------------------
  public async processRazorpayWebhook(event: string, payload: any): Promise<void> {
    try {
      if (event !== 'payment.captured') {
        logger.info(`Razorpay webhook event ignored: ${event}`);
        return;
      }

      const paymentEntity = payload?.payment?.entity;
      if (!paymentEntity || !paymentEntity.order_id || !paymentEntity.id) {
        logger.warn('Razorpay webhook payload missing payment entity or identifiers');
        return;
      }

      const existingTransaction = await this.prisma.transaction.findFirst({
        where: {
          razorpay_order_id: paymentEntity.order_id,
        },
      });

      if (!existingTransaction) {
        logger.warn(`Razorpay webhook: Transaction not found for order ${paymentEntity.order_id}`);
        return;
      }

      await this.prisma.$transaction(async tx => {
        const updatedTransaction = await tx.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            razorpay_payment_id: paymentEntity.id,
            amount: paymentEntity.amount ? paymentEntity.amount / 100 : existingTransaction.amount,
            currency: paymentEntity.currency || existingTransaction.currency,
            status: TransactionStatus.SUCCESS,
            payment_method: paymentEntity.method || existingTransaction.payment_method,
            payment_date: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),
            description: paymentEntity.description || existingTransaction.description,
            failure_reason: null,
          },
        });

        const notes: any = updatedTransaction.notes || {};
        const shop_id: string | undefined = notes.shop_id;
        const plan_id: string | undefined = notes.plan_id;
        const subscription_pricing_id: string | undefined = notes.subscription_pricing_id;
        const duration: PlanDuration | undefined = notes.duration;

        if (!shop_id || !plan_id || !subscription_pricing_id || !duration) {
          logger.warn(`Razorpay webhook: Missing subscription metadata in transaction notes for transaction ${updatedTransaction.id}`);
          return;
        }

        const pricing = await tx.subscriptionPricing.findUnique({
          where: { id: subscription_pricing_id },
          include: {
            plan: true,
          },
        });

        if (!pricing) {
          logger.warn(`Razorpay webhook: Subscription pricing not found for id ${subscription_pricing_id}`);
          return;
        }

        const now = new Date();
        const endDate = new Date(now);

        switch (duration) {
          case PlanDuration.ONE_MONTH:
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case PlanDuration.THREE_MONTHS:
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case PlanDuration.SIX_MONTHS:
            endDate.setMonth(endDate.getMonth() + 6);
            break;
          case PlanDuration.ONE_YEAR:
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          default:
            logger.warn(`Razorpay webhook: Unknown duration ${duration}, defaulting to 1 month`);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        await tx.shopSubscription.updateMany({
          where: {
            shop_id,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAYMENT_PENDING],
            },
          },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        });

        const subscription = await tx.shopSubscription.create({
          data: {
            id: ulid(),
            shop_id,
            plan_id,
            subscription_pricing_id,
            start_date: now,
            end_date: endDate,
            status: SubscriptionStatus.ACTIVE,
            auto_renew: false,
          },
        });

        await tx.shop.update({
          where: { id: shop_id },
          data: {
            subscription_status: SubscriptionStatus.ACTIVE,
            subscription_plan: pricing.plan.plan_name as SubscriptionPlanName,
            plan_start_date: now,
            plan_end_date: endDate,
          },
        });

        await tx.transaction.update({
          where: { id: updatedTransaction.id },
          data: {
            subscription_id: subscription.id,
          },
        });

        logger.info(`Subscription created from Razorpay payment for shop ${shop_id}, subscription ${subscription.id}`);
      });
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Process Razorpay webhook error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SUBSCRIPTION PLANS - Retrieve all active plans for shop users
  // -----------------------------
  public async getSubscriptionPlans(): Promise<any> {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { is_active: true },
        include: {
          pricing: {
            where: { is_active: true },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: { created_at: 'asc' },
      });
      
      logger.info(`Retrieved ${plans.length} subscription plans`);
      return plans;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get subscription plans error: ${error.message}`);
      throw error;
    }
  }
}
