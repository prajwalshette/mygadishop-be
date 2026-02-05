import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import prisma from '@/database';
import { PaymentStatus } from '@prisma/client';
import { CustomerType, ICustomer } from '@/interfaces/customer.interface';
import { ulid } from 'ulid';
import { logger } from '@utils/logger';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomerQueryDto, ExportCustomerQueryDto } from '@/schemas/customer.schema';

@Service()
export class CustomerService {
  private prisma = prisma;

  // -----------------------------
  // ADD NEW CUSTOMER - Create new customer record
  // -----------------------------
  public async addNewCustomer(customerData: ICustomer, shop_id): Promise<ICustomer> {
    try {
      const isExistCustomer = await this.prisma.customer.findFirst({
        where: { phone: customerData.phone, email: customerData.email, deleted_at: null, shop_id },
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
        where: { id: customer_id, deleted_at: null },
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
    const { page, limit, search, customer_type, last_purchase, sortBy, sortOrder } = query;
    
    try {
      const skip = (page - 1) * limit;

      // Build where clause with filters
      const whereClause: any = {
        shop_id,
        deleted_at: null,
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

      // Add last_purchase filter: customers who have at least one completed payment in the period
      if (last_purchase === 'this_month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.payments = {
          some: { status: PaymentStatus.COMPLETED, deleted_at: null, payment_date: { gte: startOfMonth, lte: now } },
        };
      } else if (last_purchase === 'last_3_months') {
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        whereClause.payments = {
          some: { status: PaymentStatus.COMPLETED, deleted_at: null, payment_date: { gte: threeMonthsAgo, lte: now } },
        };
      }
      // all_time: no extra filter

      const includePayments = {
        payments: {
          where: { status: PaymentStatus.COMPLETED, deleted_at: null },
          select: { amount: true, payment_date: true },
        },
      };

      const isAggregateSort = sortBy === 'total_spent' || sortBy === 'last_purchase';

      let mappedCustomers: any[];
      let total: number;

      if (isAggregateSort) {
        // Fetch all matching customers (no skip/take), map with aggregates, sort in memory, then paginate
        const allCustomers = await this.prisma.customer.findMany({
          where: whereClause,
          include: includePayments,
        });
        total = allCustomers.length;
        const withAggregates = allCustomers.map(customer => {
          const completedPayments = customer.payments || [];
          const totalSpent = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
          const lastPurchaseDate = completedPayments.length
            ? completedPayments.reduce((latest, p) => {
                const d = p.payment_date ? new Date(p.payment_date) : null;
                return d && (!latest || d > latest) ? d : latest;
              }, null as Date | null)
            : null;
          const { payments, ...rest } = customer;
          return {
            ...rest,
            customer_type: customer.customer_type as CustomerType,
            purchasesCount: completedPayments.length,
            totalSpent: Math.round(totalSpent * 100) / 100,
            lastPurchaseDate: lastPurchaseDate ? lastPurchaseDate.toISOString() : null,
            _lastPurchaseDate: lastPurchaseDate,
          };
        });
        withAggregates.sort((a, b) => {
          let cmp = 0;
          if (sortBy === 'total_spent') {
            cmp = (a.totalSpent ?? 0) - (b.totalSpent ?? 0);
          } else {
            const aTime = a._lastPurchaseDate ? a._lastPurchaseDate.getTime() : 0;
            const bTime = b._lastPurchaseDate ? b._lastPurchaseDate.getTime() : 0;
            cmp = aTime - bTime;
          }
          return sortOrder === 'desc' ? -cmp : cmp;
        });
        mappedCustomers = withAggregates.slice(skip, skip + limit).map(({ _lastPurchaseDate, ...c }) => c);
      } else {
        const [customers, totalCount] = await Promise.all([
          this.prisma.customer.findMany({
            where: whereClause,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            include: includePayments,
          }),
          this.prisma.customer.count({ where: whereClause }),
        ]);
        total = totalCount;
        mappedCustomers = customers.map(customer => {
          const completedPayments = customer.payments || [];
          const totalSpent = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
          const lastPurchase = completedPayments.length
            ? completedPayments.reduce((latest, p) => {
                const d = p.payment_date ? new Date(p.payment_date) : null;
                return d && (!latest || d > latest) ? d : latest;
              }, null as Date | null)
            : null;
          const { payments, ...rest } = customer;
          return {
            ...rest,
            customer_type: customer.customer_type as CustomerType,
            purchasesCount: completedPayments.length,
            totalSpent: Math.round(totalSpent * 100) / 100,
            lastPurchaseDate: lastPurchase ? lastPurchase.toISOString() : null,
          };
        });
      }

      const totalPages = Math.ceil(total / limit);
      
      logger.info(`Retrieved ${total} customers (page ${page}, limit ${limit}, filters: ${JSON.stringify({ search, customer_type, last_purchase, sortBy, sortOrder })})`);
      
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
  // GET CUSTOMER STATISTICS - Get customer stats for dashboard
  // -----------------------------
  public async getCustomerStats(shop_id: string): Promise<any> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Total customers
      const totalCustomers = await this.prisma.customer.count({
        where: {
          shop_id,
          deleted_at: null,
        },
      });

      // Active customers (same as total for now, can be customized based on business logic)
      const activeCustomers = totalCustomers;

      // New customers this month
      const newThisMonth = await this.prisma.customer.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: { gte: startOfCurrentMonth },
        },
      });

      // Customers from last month
      const lastMonthCustomers = await this.prisma.customer.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      });

      // Calculate growth rate
      const growthRate = lastMonthCustomers > 0
        ? Math.round(((newThisMonth - lastMonthCustomers) / lastMonthCustomers) * 100)
        : (newThisMonth > 0 ? 100 : 0);

      logger.info(`Retrieved customer stats for shop ${shop_id}: total=${totalCustomers}, newThisMonth=${newThisMonth}, growthRate=${growthRate}%`);

      return {
        totalCustomers,
        activeCustomers,
        newThisMonth,
        growthRate,
        lastMonthCustomers,
      };
    } catch (error) {
      logger.error(`Get customer stats error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // EXPORT CUSTOMERS - Get all customers for CSV export (no pagination)
  // -----------------------------
  public async exportCustomers(query: ExportCustomerQueryDto, shop_id: string): Promise<ICustomer[]> {
    const { search, customer_type, last_purchase, sortBy, sortOrder } = query;
    
    try {
      const whereClause: any = {
        shop_id,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (customer_type) {
        whereClause.customer_type = customer_type;
      }

      if (last_purchase === 'this_month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.payments = {
          some: { status: PaymentStatus.COMPLETED, deleted_at: null, payment_date: { gte: startOfMonth, lte: now } },
        };
      } else if (last_purchase === 'last_3_months') {
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        whereClause.payments = {
          some: { status: PaymentStatus.COMPLETED, deleted_at: null, payment_date: { gte: threeMonthsAgo, lte: now } },
        };
      }

      const orderByField = (sortBy === 'total_spent' || sortBy === 'last_purchase') ? 'created_at' : sortBy;
      const customers = await this.prisma.customer.findMany({
        where: whereClause,
        orderBy: { [orderByField]: sortOrder },
        include: {
          payments: {
            where: { status: PaymentStatus.COMPLETED, deleted_at: null },
            select: { amount: true, payment_date: true },
          },
        },
      });

      logger.info(`Exporting ${customers.length} customers (filters: ${JSON.stringify({ search, customer_type })})`);

      return customers.map(customer => {
        const completedPayments = customer.payments || [];
        const totalSpent = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const lastPurchaseDate = completedPayments.length
          ? completedPayments.reduce((latest, p) => {
              const d = p.payment_date ? new Date(p.payment_date) : null;
              return d && (!latest || d > latest) ? d : latest;
            }, null as Date | null)
          : null;
        const { payments, ...rest } = customer;
        return {
          ...rest,
          customer_type: customer.customer_type as CustomerType,
          purchasesCount: completedPayments.length,
          totalSpent: Math.round(totalSpent * 100) / 100,
          lastPurchaseDate: lastPurchaseDate ? lastPurchaseDate.toISOString() : null,
        };
      });
    } catch (error) {
      logger.error(`Export customers error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET CUSTOMER - Retrieve single customer by ID with payments, services, vehicles (for detail page)
  // -----------------------------
  public async getCustomer(customer_id: string): Promise<any> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customer_id, deleted_at: null },
        include: {
          payments: {
            where: { deleted_at: null },
            orderBy: { payment_date: 'desc' },
            include: {
              vehicle: {
                select: { id: true, brand: true, model: true, registration_number: true, type: true },
              },
            },
          },
          services: {
            where: { deleted_at: null },
            orderBy: { service_date: 'desc' },
            include: {
              vehicle: {
                select: { id: true, brand: true, model: true, registration_number: true },
              },
            },
          },
          vehicles: {
            where: { deleted_at: null },
            orderBy: { buying_date: 'desc' },
            select: {
              id: true,
              brand: true,
              model: true,
              registration_number: true,
              type: true,
              buying_price: true,
              buying_date: true,
              status: true,
            },
          },
        },
      });

      if (!customer) {
        logger.warn(`Get customer failed: Customer not found - ${customer_id}`);
        throw new NotFoundException(`Customer not found with id: ${customer_id}`);
      }

      const paymentsWithVehicle = (customer.payments || []).map((p: any) => ({
        id: p.id,
        vehicle_id: p.vehicle_id,
        amount: p.amount,
        payment_type: p.payment_type,
        method: p.method,
        status: p.status,
        payment_date: p.payment_date,
        vehicle: p.vehicle,
      }));
      const { payments, ...rest } = customer;
      const completedPayments = (customer.payments || []).filter((p: any) => p.status === 'COMPLETED');
      const totalSpent = completedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const lastPurchaseDate = completedPayments.length
        ? completedPayments.reduce((latest: Date | null, p: any) => {
            const d = p.payment_date ? new Date(p.payment_date) : null;
            return d && (!latest || d > latest) ? d : latest;
          }, null as Date | null)
        : null;

      logger.info(`Customer retrieved successfully: ${customer_id}`);
      return {
        ...rest,
        customer_type: customer.customer_type as CustomerType,
        payments: paymentsWithVehicle,
        services: customer.services || [],
        vehicles: customer.vehicles || [],
        purchasesCount: completedPayments.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastPurchaseDate: lastPurchaseDate ? lastPurchaseDate.toISOString() : null,
      };
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
        data: { deleted_at: new Date() },
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
