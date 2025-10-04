import { Router } from 'express';
import { CustomerController } from '@/controllers/customer.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { CreateCustomerDto } from '@/dtos/customer.dto';

export class CustomerRoute implements Routes {
  public path = '/customer';
  public router = Router();
  public customerController = new CustomerController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/add-customer`, [AuthMiddleware, ValidationMiddleware(CreateCustomerDto)], this.customerController.addNewCustomer);
    this.router.put(`${this.path}/update-customer/:id`, [AuthMiddleware], this.customerController.updateCustomer);
    this.router.get(`${this.path}/get-all-customer`, [AuthMiddleware], this.customerController.getAllCustomer);
    this.router.get(`${this.path}/get-customer/:id`, [AuthMiddleware], this.customerController.getCustomer);
    this.router.delete(`${this.path}/delete-customer/:id`, [AuthMiddleware], this.customerController.deleteCustomer);

  }
}
