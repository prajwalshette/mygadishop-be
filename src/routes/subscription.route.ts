import { Router } from 'express';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { AdminAuthMiddleware } from '@/middlewares/adminAuth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { CreateSubscriptionPlanDto } from '@/dtos/subscription.dto';

export class SubscriptionRoute implements Routes {
  public path = '/subscription';
  public router = Router();
  public subscriptionController = new SubscriptionController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create-plan`, [AdminAuthMiddleware, ValidationMiddleware(CreateSubscriptionPlanDto)], this.subscriptionController.createSubscriptionPlan);
    
  }
}
