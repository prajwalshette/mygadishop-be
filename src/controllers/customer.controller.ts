import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { User } from '@interfaces/users.interface';
import { CustomerService } from '@/services/customer.service';
import { ICustomer } from '@/interfaces/customer.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';

export class CustomerController {
  public customerService = Container.get(CustomerService);

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

  public getAllCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { page_number, page_size } = request.query;

      const pageNumber = page_number ? Number(page_number) : 1;
      const pageSize = page_size ? Number(page_size) : 5;

      const customers = await this.customerService.getAllCustomer(pageNumber, pageSize);
      response.status(200).json({ data: { ...customers }, message: 'Successfully Featch Customers' });
    } catch (error) {
      next(error);
    }
  };

  public getCustomer = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const customer_id = request.params.id;
      const customers = await this.customerService.getCustomer(customer_id);
      response.status(200).json({ data: customers, message: 'Successfully Featch Customer' });
    } catch (error) {
      next(error);
    }
  };

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
