import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithAdmin } from '@modules/auth/auth.interface';
import { AdminService } from './admin.service';
import { 
  UpdateShopStatusDto, 
  UpdateUserStatusDto, 
  GetShopQueryDto, 
  GetUserQueryDto,
  CreateShopDto,
  UpdateShopStatusEnhancedDto,
  GetShopVehiclesQueryDto,
  GetShopCustomersQueryDto,
  GetShopPaymentHistoryQueryDto,
  GetShopVehiclePaymentsQueryDto,
  GetShopQueryEnhancedDto,
  GetAnalyticsQueryDto,
  GetShopUsersQueryDto,
  CreateSubscriptionPlanDto,
  CreateSubscriptionPricingDto,
  ActiveDeactivePlanDto,
} from './admin.validator';

export class AdminController {
  public adminService = Container.get(AdminService);

  public getDashboardStats = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.status(200).json({ data: stats, message: 'dashboard stats' });
    } catch (error) {
      next(error);
    }
  };

  public getCurrentAdmin = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = await this.adminService.getCurrentAdmin(req.admin.id);
      res.status(200).json({ data: admin, message: 'current admin' });
    } catch (error) {
      next(error);
    }
  };

  public getAnalytics = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetAnalyticsQueryDto;
      const analytics = await this.adminService.getAnalytics(query);
      res.status(200).json({ data: analytics, message: 'analytics' });
    } catch (error) {
      next(error);
    }
  };

  public getShops = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetShopQueryDto;
      const result = await this.adminService.getShops(query);
      res.status(200).json({ data: result, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getShop = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const shop = await this.adminService.getShop(shopId);
      res.status(200).json({ data: shop, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updateShopStatus = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const { status }: UpdateShopStatusDto = req.body;

      const shop = await this.adminService.updateShopStatus(shopId, status);
      res.status(200).json({ data: shop, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteShop = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const shop = await this.adminService.deleteShop(shopId);
      res.status(200).json({ data: shop, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  public getUsers = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetUserQueryDto;
      const result = await this.adminService.getUsers(query);
      res.status(200).json({ data: result, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getUser = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.id;
      const user = await this.adminService.getUser(userId);
      res.status(200).json({ data: user, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updateUserStatus = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.id;
      const { status }: UpdateUserStatusDto = req.body;

      const user = await this.adminService.updateUserStatus(userId, status);
      res.status(200).json({ data: user, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.id;
      const user = await this.adminService.deleteUser(userId);
      res.status(200).json({ data: user, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  // Create Shop (Admin)
  public createShop = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopData: CreateShopDto = req.body;
      const shop = await this.adminService.createShop(shopData);
      res.status(201).json({ data: shop, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  // Update Shop Status Enhanced
  public updateShopStatusEnhanced = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const statusData: UpdateShopStatusEnhancedDto = req.body;
      const shop = await this.adminService.updateShopStatusEnhanced(shopId, statusData);
      res.status(200).json({ data: shop, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shop Statistics
  public getShopStatistics = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const statistics = await this.adminService.getShopStatistics(shopId);
      res.status(200).json({ data: statistics, message: 'shop statistics' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shop Vehicles
  public getShopVehicles = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const query = req.query as unknown as GetShopVehiclesQueryDto;
      const result = await this.adminService.getShopVehicles(shopId, query);
      res.status(200).json({ data: result, message: 'shop vehicles' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shop Customers
  public getShopCustomers = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const query = req.query as unknown as GetShopCustomersQueryDto;
      const result = await this.adminService.getShopCustomers(shopId, query);
      res.status(200).json({ data: result, message: 'shop customers' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shop Users
  public getShopUsers = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const query = req.query as unknown as GetShopUsersQueryDto;
      const result = await this.adminService.getShopUsers(shopId, query);
      res.status(200).json({ data: result, message: 'shop users' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shop Vehicle Payments
  public getShopVehiclePayments = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const query = req.query as unknown as GetShopVehiclePaymentsQueryDto;
      const result = await this.adminService.getShopVehiclePayments(shopId, query);
      res.status(200).json({ data: result, message: 'shop vehicle payments' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shop Payment History (Subscription Transactions)
  public getShopPaymentHistory = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.params.id;
      const query = req.query as unknown as GetShopPaymentHistoryQueryDto;
      const result = await this.adminService.getShopPaymentHistory(shopId, query);
      res.status(200).json({ data: result, message: 'subscription payment history' });
    } catch (error) {
      next(error);
    }
  };

  // Get Shops Enhanced
  public getShopsEnhanced = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetShopQueryEnhancedDto;
      const result = await this.adminService.getShopsEnhanced(query);
      res.status(200).json({ data: result, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  // Subscription Plans Management (Admin only)
  public createSubscriptionPlan = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const planData: CreateSubscriptionPlanDto = req.body;
      const plan = await this.adminService.createSubscriptionPlan(planData);
      res.status(200).json({ data: plan, message: 'Successfully Create New Plan' });
    } catch (error) {
      next(error);
    }
  };

  public updateSubscriptionPlan = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = req.params.plan_id;
      const planData: CreateSubscriptionPlanDto = req.body;
      const plan = await this.adminService.updateSubscriptionPlan(planData, plan_id);
      res.status(200).json({ data: plan, message: 'Successfully Update Plan' });
    } catch (error) {
      next(error);
    }
  };

  public getSubscriptionPlan = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await this.adminService.getSubscriptionPlan();
      res.status(200).json({ data: plan, message: 'Plan Featch Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public createSubscriptionPricing = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = req.params.plan_id;
      const pricingData: CreateSubscriptionPricingDto = req.body;
      const pricing = await this.adminService.createSubscriptionPricing({...pricingData, plan_id, is_active: true});
      res.status(200).json({ data: pricing, message: 'Successfully Create Pricing' });
    } catch (error) {
      next(error);
    }
  };

  public updateSubscriptionPricing = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = req.params.plan_id;
      const subscription_pricing_id = req.params.subscription_pricing_id;
      const pricingData: CreateSubscriptionPricingDto = req.body;
      const pricing = await this.adminService.updateSubscriptionPricing({...pricingData, plan_id, id: '', is_active: true}, subscription_pricing_id);
      res.status(200).json({ data: pricing, message: 'Successfully Update Pricing' });
    } catch (error) {
      next(error);
    }
  };

  public activeDeactiveSubscriptionPlan = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan_id = req.params.plan_id;
      const { is_active }: ActiveDeactivePlanDto = req.body;
      await this.adminService.activeDeactiveSubscriptionPlan(plan_id, is_active);
      res.status(200).json({ message: is_active ? 'Successfully active subscription plan' : 'Successfully deactive subscription plan' });
    } catch (error) {
      next(error);
    }
  };
}
