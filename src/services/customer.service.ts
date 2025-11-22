import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import prisma from '@/database';
import { CustomerType, ICustomer } from '@/interfaces/customer.interface';
import { ulid } from 'ulid';
import { logger } from '@utils/logger';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomerQueryDto } from '@/schemas/customer.schema';

@Service()
export class CustomerService {
  private prisma = prisma;

  // -----------------------------
  // ADD NEW CUSTOMER - Create new customer record
  // -----------------------------
  public async addNewCustomer(customerData: ICustomer, shop_id): Promise<ICustomer> {
    try {
      const isExistCustomer = await this.prisma.customer.findFirst({
        where: { phone: customerData.phone, email: customerData.email, is_deleted: false, shop_id },
      });

      if (isExistCustomer) {
        logger.warn(`Add customer failed: Customer already exists - Email: ${customerData.email}, Phone: ${customerData.phone}`);
        throw new ConflictException(`Customer already exists with email: ${customerData.email} or phone: ${customerData.phone}`);
      }
      
      const newCustomer = await this.prisma.customer.create({
        data: {
          id: ulid(),
          shop_id,
          ...customerData,
        },
      });
      
      logger.info(`Customer created successfully: ${newCustomer.name} (${newCustomer.id})`);
      return {...newCustomer, customer_type: newCustomer.customer_type as CustomerType };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Add customer error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE CUSTOMER - Modify existing customer details
  // -----------------------------
   public async updateCustomer(customerData: ICustomer, customer_id: string): Promise<ICustomer> {
    try {
      const isExistCustomer = await this.prisma.customer.findFirst({
        where: { id: customer_id, is_deleted: false },
      });

      if (!isExistCustomer) {
        logger.warn(`Update customer failed: Customer not found - ${customer_id}`);
        throw new NotFoundException(`Customer not found with id: ${customer_id}`);
      }
      
      const customer = await this.prisma.customer.update({
        where: { id: customer_id },
        data: {
          ...customerData,
        },
      });
      
      logger.info(`Customer updated successfully: ${customer.name} (${customer_id})`);
      return {...customer, customer_type: customer.customer_type as CustomerType };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update customer error for ${customer_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET ALL CUSTOMERS - Retrieve paginated customer list
  // -----------------------------
  public async getAllCustomer(query: GetCustomerQueryDto, shop_id: string): Promise<any> {
    const { page, limit, search, customer_type, sortBy, sortOrder } = query;
    
    try {
      const skip = (page - 1) * limit;

      // Build where clause with filters
      const whereClause: any = {
        shop_id,
        is_deleted: false,
      };

      // Add search filter (searches across multiple fields)
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add customer_type filter
      if (customer_type) {
        whereClause.customer_type = customer_type;
      }

      // Fetch customers and total count in parallel using Promise.all
      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.customer.count({ where: whereClause }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      const mappedCustomers = customers.map(customer => ({
        ...customer,
        customer_type: customer.customer_type as CustomerType,
      }));
      
      logger.info(`Retrieved ${total} customers (page ${page}, limit ${limit}, filters: ${JSON.stringify({ search, customer_type })})`);
      
      return {
        customers: mappedCustomers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Get all customers error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET CUSTOMER - Retrieve single customer by ID
  // -----------------------------
  public async getCustomer(customer_id: string): Promise<ICustomer> {
    try {
      const customer = await this.prisma.customer.findFirst({ where: { id: customer_id, is_deleted: false } });
      
      if (!customer) {
        logger.warn(`Get customer failed: Customer not found - ${customer_id}`);
        throw new NotFoundException(`Customer not found with id: ${customer_id}`);
      }
      
      logger.info(`Customer retrieved successfully: ${customer_id}`);
      return { ...customer, customer_type: customer.customer_type as CustomerType };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get customer error for ${customer_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE CUSTOMER - Soft delete customer
  // -----------------------------
  public async deleteCustomer(customer_id: string): Promise<any> {
    try {
      const customer = await this.prisma.customer.findUnique({ where: { id: customer_id } });

      if (!customer) {
        logger.warn(`Delete customer failed: Customer not found - ${customer_id}`);
        throw new NotFoundException(`Customer not found with id: ${customer_id}`);
      }

      await this.prisma.customer.update({
        where: { id: customer_id },
        data: { is_deleted: true },
      });

      logger.info(`Customer deleted successfully: ${customer_id}`);
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete customer error for ${customer_id}: ${error.message}`);
      throw error;
    }
  }
}
