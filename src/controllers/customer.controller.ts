import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { User } from '@interfaces/users.interface';
import { CustomerService } from '@/services/customer.service';
import { ICustomer } from '@/interfaces/customer.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { GetCustomerQueryDto, ExportCustomerQueryDto } from '@/schemas/customer.schema';
import { stringify } from 'csv-stringify/sync';
import { logger } from '@utils/logger';
import { NotFoundException } from '@/exceptions/NotFoundException';

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
  // GET CUSTOMER STATISTICS - Get customer stats for dashboard
  // -----------------------------
  public getCustomerStats = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const stats = await this.customerService.getCustomerStats(shop_id);
      response.status(200).json({ data: stats, message: 'Successfully Retrieved Customer Statistics' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // EXPORT CUSTOMERS TO CSV - Export customers data as CSV
  // -----------------------------
  public exportCustomersToCSV = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = request.query as unknown as ExportCustomerQueryDto;
      const shop_id = request.user.shop_id;

      logger.info(`Export customers CSV requested by shop ${shop_id} with filters: ${JSON.stringify(query)}`);

      const customers = await this.customerService.exportCustomers(query, shop_id);

      if (customers.length === 0) {
        logger.warn(`No customers found for export with filters: ${JSON.stringify(query)}`);
        throw new NotFoundException('No customers found to export');
      }

      // Define CSV columns
      const columns = [
        'Name',
        'Email',
        'Phone',
        'Address',
        'City',
        'State',
        'Pincode',
        'Customer Type',
        'Purchases',
        'Total Spent',
        'Last Purchase',
        'Created On',
      ];

      // Helper function to format date as DD/MM/YYYY
      const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Convert customers to CSV rows
      const rows = customers.map((customer: any) => [
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.city || '',
        customer.state || '',
        customer.pincode || '',
        customer.customer_type || '',
        String(customer.purchasesCount ?? 0),
        String(customer.totalSpent ?? 0),
        formatDate(customer.lastPurchaseDate),
        formatDate(customer.created_at),
      ]);

      // Generate CSV string
      const csv = stringify(rows, {
        header: true,
        columns: columns,
        quoted: true,
      });

      logger.info(`Successfully exported ${customers.length} customers to CSV`);

      // Set response headers for CSV download
      const filename = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.status(200).send(csv);
    } catch (error) {
      logger.error(`Export customers CSV error: ${error.message}`);
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
