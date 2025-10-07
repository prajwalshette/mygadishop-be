import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { User } from '@interfaces/users.interface';
import { CustomerService } from '@/services/customer.service';
import { ICustomer } from '@/interfaces/customer.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';

export class ShopController {
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

}