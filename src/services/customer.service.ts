import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { CustomerType, ICustomer } from '@/interfaces/customer.interface';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';

@Service()
export class CustomerService {
  private prisma = prisma;

  public async addNewCustomer(customerData: ICustomer, shop_id): Promise<ICustomer> {
    try {
      const isExistCustomer = await this.prisma.customer.findFirst({
        where: { phone: customerData.id, email: customerData.email, is_deleted: false },
      });

      if (isExistCustomer) {
        throw new HttpException(404, `customer alredy exist email: ${customerData.email}, phone: ${customerData.phone}`);
      }
      const newCustomer = await this.prisma.customer.create({
        data: {
          id: ulid(),
          shop_id,
          ...customerData,
        },
      });
      return {...newCustomer, customer_type: newCustomer.customer_type as CustomerType };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Add New Customer: ${error.message}`);
    }
  }

   public async updateCustomer(customerData: ICustomer, customer_id: string): Promise<ICustomer> {
    try {
      const isExistCustomer = await this.prisma.customer.findFirst({
        where: { id: customer_id, is_deleted: false },
      });

      if (!isExistCustomer) {
        throw new HttpException(404, `customer not found with provided id: ${customer_id}`);
      }
      const customer = await this.prisma.customer.update({
        where: { id: customer_id },
        data: {
          ...customerData,
        },
      });
      return {...customer, customer_type: customer.customer_type as CustomerType };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error update Customer: ${error.message}`);
    }
  }

  public async getAllCustomer(pageNumber: number, pageSize: number): Promise<{ customers: ICustomer[]; customerCount: number }> {
    try {
      const skip = (pageNumber - 1) * pageSize;
      const customers = await this.prisma.customer.findMany({
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      });

      const customerCount = await this.prisma.customer.count({
        where: { is_deleted: false },
      });

      const mappedCustomers = customers.map(customer => ({
        ...customer,
        customer_type: customer.customer_type as CustomerType,
      }));
      return { customers: mappedCustomers, customerCount };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Featch all Customer: ${error.message}`);
    }
  }

  public async getCustomer(customer_id: string): Promise<ICustomer> {
    try {
      const customer = await this.prisma.customer.findFirst({ where: { id: customer_id, is_deleted: false } });
      if (!customer) {
        throw new HttpException(404, `customer not fount with provided id: ${customer_id}`);
      }
      return { ...customer, customer_type: customer.customer_type as CustomerType };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Featch Customer: ${error.message}`);
    }
  }

  public async deleteCustomer(customer_id: string): Promise<any> {
    try {
      const customer = await this.prisma.customer.findUnique({ where: { id: customer_id } });

      if (!customer) {
        throw new HttpException(404, `customer not fount with provided id: ${customer_id}`);
      }

      await this.prisma.customer.update({
        where: { id: customer_id },
        data: { is_deleted: true },
      });

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error delete customer: ${error.message}`);
    }
  }
}
