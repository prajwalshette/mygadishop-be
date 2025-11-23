import { Router } from 'express';
import { CustomerController } from '@/controllers/customer.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidateRequest } from '@middlewares/validation.middleware';
import { createCustomerSchema, updateCustomerSchema, customerIdParamSchema, getCustomerQuerySchema, exportCustomerQuerySchema } from '@/schemas/customer.schema';

export class CustomerRoute implements Routes {
  public path = '/customer';
  public router = Router();
  public customerController = new CustomerController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/add-customer`, [AuthMiddleware, ValidateRequest({ body: createCustomerSchema })], this.customerController.addNewCustomer);
    
    this.router.put(`${this.path}/update-customer/:id`, [AuthMiddleware, ValidateRequest({ body: updateCustomerSchema, params: customerIdParamSchema })], this.customerController.updateCustomer);
    
    this.router.get(`${this.path}/get-all-customer`, [AuthMiddleware, ValidateRequest({ query: getCustomerQuerySchema })], this.customerController.getAllCustomer);
    
    this.router.get(`${this.path}/stats`, [AuthMiddleware], this.customerController.getCustomerStats);
    
    this.router.get(`${this.path}/export-customers`, [AuthMiddleware, ValidateRequest({ query: exportCustomerQuerySchema })], this.customerController.exportCustomersToCSV);
    
    this.router.get(`${this.path}/get-customer/:id`, [AuthMiddleware, ValidateRequest({ params: customerIdParamSchema })], this.customerController.getCustomer);
    
    this.router.delete(`${this.path}/delete-customer/:id`, [AuthMiddleware, ValidateRequest({ params: customerIdParamSchema })], this.customerController.deleteCustomer);
  }
}
