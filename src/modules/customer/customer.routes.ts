import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ValidationMiddleware, ValidateRequest } from '@/middlewares/validation.middleware';
import {
  createCustomerSchema,
  exportCustomerQuerySchema,
  getCustomerQuerySchema,
  searchCustomerByPhoneNumberSchema,
  updateCustomerSchema,
} from './customer.validator';
import { CustomerController } from './customer.controller';
import multer from 'multer';

export class CustomerRoute implements Routes {
  public path = '/customer';
  public router: Router = Router();
  public customerController = new CustomerController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/add-customer`,
      [AuthMiddleware, ValidationMiddleware(createCustomerSchema, 'body')],
      this.customerController.addNewCustomer,
    );
    this.router.put(
      `${this.path}/update-customer/:id`,
      [AuthMiddleware, ValidationMiddleware(updateCustomerSchema, 'body')],
      this.customerController.updateCustomer,
    );
    this.router.get(
      `${this.path}/get-all-customer`,
      [AuthMiddleware, ValidateRequest({ query: getCustomerQuerySchema })],
      this.customerController.getAllCustomer,
    );
    this.router.get(`${this.path}/get-customer/:id`, [AuthMiddleware], this.customerController.getCustomer);
    this.router.get(`${this.path}/search-customer-by-phone-number`, [AuthMiddleware, ValidateRequest({ query: searchCustomerByPhoneNumberSchema })], this.customerController.searchCustomerByPhoneNumber);
    this.router.get(`${this.path}/stats`, [AuthMiddleware], this.customerController.getCustomerStats);
    this.router.get(
      `${this.path}/export-customers`,
      [AuthMiddleware, ValidateRequest({ query: exportCustomerQuerySchema })],
      this.customerController.exportCustomersToCSV,
    );
    this.router.delete(`${this.path}/delete-customer/:id`, [AuthMiddleware], this.customerController.deleteCustomer);

    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    });

    this.router.post(`${this.path}/upload-csv`, [AuthMiddleware, upload.single('file')], (req, res, next) =>
      this.customerController.uploadCustomerCsv(req, res, next),
    );
    this.router.get(`${this.path}/sync-status/:upload_id`, [AuthMiddleware], (req, res, next) =>
      this.customerController.getSyncStatus(req, res, next),
    );
  }
}
