import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { User } from '@interfaces/users.interface';
import { CustomerService } from '@/services/customer.service';
import { ICustomer } from '@/interfaces/customer.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { GetCustomerQueryDto } from '@/schemas/customer.schema';

export class CustomerController {
  public customerService = Container.get(CustomerService);

  // -----------------------------
  // ADD NEW CUSTOMER - Create new customer
  // -----------------------------
  public addNewCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const customerData: ICustomer = request.body;

      const customer = await this.customerService.addNewCustomer(customerData, shop_id);
      response.status(200).json({ data: customer, message: 'New Customer Add successfully.' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UPDATE CUSTOMER - Modify existing customer
  // -----------------------------
  public updateCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const customer_id = request.params.id;
      if (!customer_id) {
        throw new Error('Customer ID is required');
      }
      const customerData: ICustomer = request.body;

      const customer = await this.customerService.updateCustomer(customerData, customer_id);
      response.status(200).json({ data: customer, message: 'Customer update successfully.' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET ALL CUSTOMERS - Retrieve paginated customer list
  // -----------------------------
  public getAllCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Query is validated by ValidateRequest middleware
      const query = request.query as unknown as GetCustomerQueryDto;
      const shop_id = request.user.shop_id;

      const result = await this.customerService.getAllCustomer(query, shop_id);
      response.status(200).json({ data: result, message: 'Successfully Retrieved Customers' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET CUSTOMER - Retrieve single customer by ID
  // -----------------------------
  public getCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const customer_id = request.params.id;
      const customers = await this.customerService.getCustomer(customer_id);
      response.status(200).json({ data: customers, message: 'Successfully Featch Customer' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // DELETE CUSTOMER - Soft delete customer
  // -----------------------------
  public deleteCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const customer_id = request.params.id;
      const customers = await this.customerService.deleteCustomer(customer_id);
      response.status(200).json({ data: true, message: 'Successfully delete customer' });
    } catch (error) {
      next(error);
    }
  };
}
