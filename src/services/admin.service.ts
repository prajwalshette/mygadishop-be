import { Service } from 'typedi';
import prisma from '@/database';
import { Prisma, Shop, User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import { logger } from '@utils/logger';
import { 
  GetShopQueryDto, 
  GetUserQueryDto,
  CreateShopDto,
  UpdateShopStatusEnhancedDto,
  GetShopVehiclesQueryDto,
  GetShopCustomersQueryDto,
  GetShopPaymentHistoryQueryDto,
  GetShopVehiclePaymentsQueryDto,
  GetShopQueryEnhancedDto,
  GetAnalyticsQueryDto,
  GetShopUsersQueryDto,
  CreateSubscriptionPlanDto,
  CreateSubscriptionPricingDto,
} from '@/schemas/admin.schema';
import { ISubscriptionPlan, ISubscriptionPricing, PlanDuration, SubscriptionPlanName } from '@/interfaces/subscription.interface';
import bcrypt from 'bcryptjs';
import { ulid } from 'ulid';

@Service()
export class AdminService {
  public async getCurrentAdmin(adminId: string) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          permissions: true,
          is_active: true,
          deleted_at: true,
          created_at: true,
          updated_at: true,
        },
      });
      
      if (!admin) throw new NotFoundException('Admin not found');
      if (admin.deleted_at) throw new NotFoundException('Admin not found');
      if (!admin.is_active) throw new HttpException(403, 'Admin account is inactive');
      
      return admin;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get current admin error for ${adminId}: ${error.message}`);
      throw error;
    }
  }

  public async getDashboardStats() {
    try {
      const totalShops = await prisma.shop.count();
      const totalUsers = await prisma.user.count();
      const activeSubscriptions = await prisma.shopSubscription.count({
        where: { status: 'ACTIVE' },
      });

      // Calculate monthly revenue (sum of successful transactions in current month)
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const revenueResult = await prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'SUCCESS',
          created_at: {
            gte: firstDay,
            lte: lastDay,
          },
        },
      });

      const monthlyRevenue = revenueResult._sum.amount || 0;

      return {
        totalShops,
        totalUsers,
        activeSubscriptions,
        monthlyRevenue: `₹${monthlyRevenue.toLocaleString()}`,
      };
    } catch (error) {
      logger.error(`Get dashboard stats error: ${error.message}`);
      throw error;
    }
  }

  public async getShops(query: GetShopQueryDto): Promise<{ shops: Shop[]; pagination: any }> {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { shop_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        whereClause.is_active = status === 'active';
      }

      const [shops, total] = await Promise.all([
        prisma.shop.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.shop.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${shops.length} shops (page ${page}, limit ${limit})`);
      return {
        shops,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Get shops error: ${error.message}`);
      throw error;
    }
  }

  public async getShop(shopId: string): Promise<Shop> {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          subscriptions: true,
          users: true,
        },
      });
      if (!shop) throw new NotFoundException('Shop not found');
      return shop;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  public async updateShopStatus(shopId: string, isActive: boolean): Promise<Shop> {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const updatedShop = await prisma.shop.update({
        where: { id: shopId },
        data: { is_active: isActive },
      });
      logger.info(`Shop status updated: ${shop.shop_name} (${shopId}) to ${isActive}`);
      return updatedShop;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update shop status error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  public async deleteShop(shopId: string): Promise<Shop> {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const deletedShop = await prisma.shop.delete({ where: { id: shopId } });
      logger.info(`Shop deleted: ${shop.shop_name} (${shopId})`);
      return deletedShop;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete shop error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  public async getUsers(query: GetUserQueryDto): Promise<{ users: User[]; pagination: any }> {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [{ email: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }];
      }

      if (status) {
        whereClause.is_active = status === 'active';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            shop: {
              select: {
                shop_name: true,
              },
            },
          },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${users.length} users (page ${page}, limit ${limit})`);
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Get users error: ${error.message}`);
      throw error;
    }
  }

  public async getUser(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          shop: true,
        },
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get user error for ${userId}: ${error.message}`);
      throw error;
    }
  }

  public async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { is_active: isActive },
      });
      logger.info(`User status updated: ${user.email} (${userId}) to ${isActive}`);
      return updatedUser;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update user status error for ${userId}: ${error.message}`);
      throw error;
    }
  }

  public async deleteUser(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const deletedUser = await prisma.user.delete({ where: { id: userId } });
      logger.info(`User deleted: ${user.email} (${userId})`);
      return deletedUser;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete user error for ${userId}: ${error.message}`);
      throw error;
    }
  }

  // Create Shop (Admin)
  public async createShop(shopData: CreateShopDto): Promise<Shop> {
    try {
      const existingShop = await prisma.shop.findFirst({
        where: {
          OR: [
            { email: shopData.email },
            { phone: shopData.phone },
          ],
        },
      });

      if (existingShop) {
        throw new ConflictException('Shop with this email or phone already exists');
      }

      const shop = await prisma.shop.create({
        data: {
          id: ulid(),
          ...shopData,
          subscription_status: 'TRIAL',
          is_verified: false,
          is_active: true,
        } as Prisma.ShopUncheckedCreateInput,
      });

      logger.info(`Shop created by admin: ${shop.shop_name} (${shop.id})`);
      return shop;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create shop error: ${error.message}`);
      throw error;
    }
  }

  // Update Shop Status (Enhanced)
  public async updateShopStatusEnhanced(shopId: string, statusData: UpdateShopStatusEnhancedDto): Promise<Shop> {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const updatedShop = await prisma.shop.update({
        where: { id: shopId },
        data: statusData,
      });

      logger.info(`Shop status updated: ${shop.shop_name} (${shopId})`);
      return updatedShop;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update shop status error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shop Statistics
  public async getShopStatistics(shopId: string) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const [totalVehicles, totalCustomers, activeStaff, totalRevenue] = await Promise.all([
        prisma.vehicle.count({
          where: { shop_id: shopId, deleted_at: null },
        }),
        prisma.customer.count({
          where: { shop_id: shopId, deleted_at: null },
        }),
        prisma.user.count({
          where: { shop_id: shopId, is_active: true, deleted_at: null },
        }),
        prisma.transaction.aggregate({
          where: {
            shop_id: shopId,
            status: 'SUCCESS',
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        totalVehicles,
        totalCustomers,
        activeStaff,
        totalRevenue: totalRevenue._sum.amount || 0,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop statistics error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shop Vehicles
  public async getShopVehicles(shopId: string, query: GetShopVehiclesQueryDto) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const { page, limit, search, status, type, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        shop_id: shopId,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = [
          { registration_number: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (type) {
        whereClause.type = type;
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        }),
        prisma.vehicle.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${vehicles.length} vehicles for shop ${shopId}`);
      return {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop vehicles error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shop Customers
  public async getShopCustomers(shopId: string, query: GetShopCustomersQueryDto) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const { page, limit, search, customer_type, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        shop_id: shopId,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (customer_type) {
        whereClause.customer_type = customer_type;
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            vehicles: {
              select: {
                id: true,
                registration_number: true,
                brand: true,
                model: true,
                status: true,
              },
              take: 5,
            },
          },
        }),
        prisma.customer.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${customers.length} customers for shop ${shopId}`);
      return {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop customers error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shop Users
  public async getShopUsers(shopId: string, query: GetShopUsersQueryDto) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const { page, limit, search, status, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        shop_id: shopId,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        whereClause.is_active = status === 'active';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            is_active: true,
            created_at: true,
          },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${users.length} users for shop ${shopId}`);
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop users error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shop Vehicle Payments (VehiclePayment model)
  public async getShopVehiclePayments(shopId: string, query: GetShopVehiclePaymentsQueryDto) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const { page, limit, search, status, payment_type, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        shop_id: shopId,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = [
          { notes: { contains: search, mode: 'insensitive' } },
          { transaction_id: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (payment_type) {
        whereClause.payment_type = payment_type;
      }

      const [payments, total] = await Promise.all([
        prisma.vehiclePayment.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            vehicle: {
              select: {
                id: true,
                registration_number: true,
                brand: true,
                model: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        }),
        prisma.vehiclePayment.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${payments.length} vehicle payments for shop ${shopId}`);
      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop vehicle payments error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shop Payment History (Transaction model - Subscription payments)
  public async getShopPaymentHistory(shopId: string, query: GetShopPaymentHistoryQueryDto) {
    try {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');

      const { page, limit, status, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        shop_id: shopId,
      };

      if (status) {
        whereClause.status = status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            subscription: {
              select: {
                id: true,
                plan: {
                  select: {
                    plan_name: true,
                  },
                },
              },
            },
          },
        }),
        prisma.transaction.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${transactions.length} transactions for shop ${shopId}`);
      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get shop payment history error for ${shopId}: ${error.message}`);
      throw error;
    }
  }

  // Get Shops with Enhanced Filters
  public async getShopsEnhanced(query: GetShopQueryEnhancedDto): Promise<{ shops: Shop[]; pagination: any }> {
    const { page, limit, search, status, subscription_status, subscription_plan, state, city, sortBy, sortOrder } = query;
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { shop_name: { contains: search, mode: 'insensitive' } },
          { owner_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        whereClause.is_active = status === 'active';
      }

      if (subscription_status) {
        whereClause.subscription_status = subscription_status;
      }

      if (subscription_plan) {
        whereClause.subscription_plan = subscription_plan;
      }

      if (state) {
        whereClause.state = { contains: state, mode: 'insensitive' };
      }

      if (city) {
        whereClause.city = { contains: city, mode: 'insensitive' };
      }

      const [shops, total] = await Promise.all([
        prisma.shop.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.shop.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${shops.length} shops with enhanced filters (page ${page}, limit ${limit})`);
      return {
        shops,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Get shops enhanced error: ${error.message}`);
      throw error;
    }
  }

  public async getAnalytics(query: GetAnalyticsQueryDto) {
    try {
      const { months = 6, topShopsLimit = 5, startDate, endDate } = query;
      
      // Calculate date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Helper function to calculate percentage change
      const calculateChange = (current: number, previous: number): { value: string; trend: 'up' | 'down' } => {
        if (previous === 0) {
          return { value: current > 0 ? '+100%' : '0%', trend: current > 0 ? 'up' : 'down' };
        }
        const change = ((current - previous) / previous) * 100;
        return {
          value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
          trend: change >= 0 ? 'up' : 'down'
        };
      };

      // 1. Revenue Metrics (Current vs Previous Month)
      const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            status: 'SUCCESS',
            created_at: { gte: currentMonthStart, lte: currentMonthEnd }
          }
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            status: 'SUCCESS',
            created_at: { gte: previousMonthStart, lte: previousMonthEnd }
          }
        })
      ]);

      const currentRevenue = currentMonthRevenue._sum.amount || 0;
      const previousRevenue = previousMonthRevenue._sum.amount || 0;
      const revenueChange = calculateChange(currentRevenue, previousRevenue);

      // 2. Users Metrics (Current vs Previous Month)
      const [currentMonthUsers, previousMonthUsers] = await Promise.all([
        prisma.user.count({
          where: {
            created_at: { gte: currentMonthStart, lte: currentMonthEnd }
          }
        }),
        prisma.user.count({
          where: {
            created_at: { gte: previousMonthStart, lte: previousMonthEnd }
          }
        })
      ]);

      const totalUsers = await prisma.user.count();
      const usersChange = calculateChange(currentMonthUsers, previousMonthUsers);

      // 3. Shops Metrics (Current vs Previous Month)
      const [currentMonthShops, previousMonthShops] = await Promise.all([
        prisma.shop.count({
          where: {
            created_at: { gte: currentMonthStart, lte: currentMonthEnd }
          }
        }),
        prisma.shop.count({
          where: {
            created_at: { gte: previousMonthStart, lte: previousMonthEnd }
          }
        })
      ]);

      const totalShops = await prisma.shop.count({ where: { deleted_at: null } });
      const shopsChange = calculateChange(currentMonthShops, previousMonthShops);

      // 4. Subscriptions Metrics (Current vs Previous Month)
      const [currentMonthSubscriptions, previousMonthSubscriptions] = await Promise.all([
        prisma.shopSubscription.count({
          where: {
            status: 'ACTIVE',
            created_at: { gte: currentMonthStart, lte: currentMonthEnd }
          }
        }),
        prisma.shopSubscription.count({
          where: {
            status: 'ACTIVE',
            created_at: { gte: previousMonthStart, lte: previousMonthEnd }
          }
        })
      ]);

      const totalSubscriptions = await prisma.shopSubscription.count({ where: { status: 'ACTIVE' } });
      const subscriptionsChange = calculateChange(currentMonthSubscriptions, previousMonthSubscriptions);

      // 5. Monthly Revenue for last N months
      const monthlyRevenueData = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const monthRevenue = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            status: 'SUCCESS',
            created_at: { gte: monthStart, lte: monthEnd }
          }
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthlyRevenueData.push({
          month: monthNames[monthStart.getMonth()],
          revenue: monthRevenue._sum.amount || 0
        });
      }

      // 6. Top Performing Shops (by revenue in current month)
      // Get all shops with transactions in current month
      const shopsWithTransactions = await prisma.shop.findMany({
        where: {
          deleted_at: null,
          transactions: {
            some: {
              status: 'SUCCESS',
              created_at: { gte: currentMonthStart, lte: currentMonthEnd }
            }
          }
        },
        include: {
          transactions: {
            where: {
              status: 'SUCCESS',
              created_at: { gte: currentMonthStart, lte: currentMonthEnd }
            },
            select: { amount: true, created_at: true }
          }
        }
      });

      // Calculate revenue for each shop and sort
      const shopsWithRevenue = shopsWithTransactions.map(shop => {
        const shopRevenue = shop.transactions.reduce((sum, t) => sum + t.amount, 0);
        return {
          id: shop.id,
          name: shop.shop_name,
          revenue: shopRevenue,
          shopId: shop.id
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Get top N shops and calculate growth
      const topShopsIds = shopsWithRevenue.slice(0, topShopsLimit).map(s => s.shopId);
      
      // Get previous month revenue for top shops
      const previousMonthTransactions = await prisma.transaction.groupBy({
        by: ['shop_id'],
        where: {
          shop_id: { in: topShopsIds },
          status: 'SUCCESS',
          created_at: { gte: previousMonthStart, lte: previousMonthEnd }
        },
        _sum: { amount: true }
      });

      const previousMonthRevenueMap = new Map(
        previousMonthTransactions.map(t => [t.shop_id, t._sum.amount || 0])
      );

      const topShopsWithRevenue = shopsWithRevenue.slice(0, topShopsLimit).map(item => {
        const previousRevenue = previousMonthRevenueMap.get(item.shopId) || 0;
        const growth = calculateChange(item.revenue, previousRevenue);
        
        return {
          id: item.id,
          name: item.name,
          revenue: item.revenue,
          revenueFormatted: `₹${item.revenue.toLocaleString()}`,
          growth: growth.value
        };
      });

      // 7. Subscription Distribution by Plan
      const subscriptionDistribution = await prisma.shopSubscription.groupBy({
        by: ['plan_id'],
        where: { status: 'ACTIVE' },
        _count: { plan_id: true }
      });

      const plans = await prisma.subscriptionPlan.findMany({
        where: { id: { in: subscriptionDistribution.map(s => s.plan_id) } }
      });

      const totalActiveSubscriptions = subscriptionDistribution.reduce((sum, s) => sum + s._count.plan_id, 0);
      
      const distribution = subscriptionDistribution.map(sub => {
        const plan = plans.find(p => p.id === sub.plan_id);
        const count = sub._count.plan_id;
        const percentage = totalActiveSubscriptions > 0 ? Math.round((count / totalActiveSubscriptions) * 100) : 0;
        
        return {
          plan: plan?.plan_name || 'Unknown',
          count,
          percentage
        };
      });

      logger.info(`Analytics data retrieved successfully for ${months} months`);
      
      return {
        metrics: {
          revenue: {
            current: `₹${currentRevenue.toLocaleString()}`,
            previous: `₹${previousRevenue.toLocaleString()}`,
            change: revenueChange.value,
            trend: revenueChange.trend
          },
          users: {
            current: totalUsers.toLocaleString(),
            previous: previousMonthUsers.toLocaleString(),
            change: usersChange.value,
            trend: usersChange.trend
          },
          shops: {
            current: totalShops.toLocaleString(),
            previous: previousMonthShops.toLocaleString(),
            change: shopsChange.value,
            trend: shopsChange.trend
          },
          subscriptions: {
            current: totalSubscriptions.toLocaleString(),
            previous: previousMonthSubscriptions.toLocaleString(),
            change: subscriptionsChange.value,
            trend: subscriptionsChange.trend
          }
        },
        monthlyRevenue: monthlyRevenueData,
        topShops: topShopsWithRevenue,
        subscriptionDistribution: distribution
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get analytics error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // SUBSCRIPTION PLAN MANAGEMENT (Admin only)
  // -----------------------------

  // CREATE SUBSCRIPTION PLAN - Add new subscription plan
  public async createSubscriptionPlan(planData: CreateSubscriptionPlanDto): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await prisma.subscriptionPlan.findFirst({
        where: { plan_name: planData.plan_name },
      });

      if (isExistPlan) {
        logger.warn(`Create plan failed: Plan already exists - ${planData.plan_name}`);
        throw new ConflictException(`${planData.plan_name} Plan already exists`);
      }
      
      const newPlan = await prisma.subscriptionPlan.create({
        data: {
          id: ulid(),
          ...planData,
        },
      });
      
      logger.info(`Subscription plan created successfully: ${newPlan.plan_name} (${newPlan.id})`);
      return { ...newPlan, plan_name: newPlan.plan_name as SubscriptionPlanName };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create subscription plan error: ${error.message}`);
      throw error;
    }
  }

  // UPDATE SUBSCRIPTION PLAN - Modify existing plan
  public async updateSubscriptionPlan(planData: CreateSubscriptionPlanDto, plan_id: string): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
      });

      if (!isExistPlan) {
        logger.warn(`Update plan failed: Plan not found - ${plan_id}`);
        throw new NotFoundException('Plan not found');
      }
      
      const plan = await prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          plan_name: planData.plan_name,
          description: planData.description,
          max_vehicles: planData.max_vehicles,
          max_staff_users: planData.max_staff_users,
        },
      });
      
      logger.info(`Subscription plan updated successfully: ${plan.plan_name} (${plan_id})`);
      return { ...plan, plan_name: plan.plan_name as SubscriptionPlanName };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update subscription plan error for ${plan_id}: ${error.message}`);
      throw error;
    }
  }

  // GET SUBSCRIPTION PLANS - Retrieve all active plans
  public async getSubscriptionPlan(): Promise<any> {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { is_active: true },
        include: {
          pricing: true,
        },
      });
      
      logger.info(`Retrieved ${plans.length} subscription plans`);
      return plans;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get subscription plans error: ${error.message}`);
      throw error;
    }
  }

  // CREATE SUBSCRIPTION PRICING - Add pricing for a plan
  public async createSubscriptionPricing(pricingData: ISubscriptionPricing): Promise<ISubscriptionPricing> {
    try {
      const isExistPricing = await prisma.subscriptionPricing.findFirst({
        where: { plan_id: pricingData.plan_id, duration: pricingData.duration },
      });

      if (isExistPricing) {
        logger.warn(`Create pricing failed: Pricing already exists for plan ${pricingData.plan_id} with duration ${pricingData.duration}`);
        throw new ConflictException(`Pricing already exists in this plan for duration ${pricingData.duration}`);
      }
      
      const newPricing = await prisma.subscriptionPricing.create({
        data: {
          id: ulid(),
          ...pricingData,
        },
      });
      
      logger.info(`Subscription pricing created successfully: ${newPricing.duration} (${newPricing.id})`);
      return { ...newPricing, duration: newPricing.duration as PlanDuration };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create subscription pricing error: ${error.message}`);
      throw error;
    }
  }

  // UPDATE SUBSCRIPTION PRICING - Modify existing pricing
  public async updateSubscriptionPricing(pricingData: ISubscriptionPricing, subscription_pricing_id: string): Promise<ISubscriptionPricing> {
    try {
      const isExistPricing = await prisma.subscriptionPricing.findFirst({
        where: { plan_id: pricingData.plan_id, id: subscription_pricing_id },
      });

      if (!isExistPricing) {
        logger.warn(`Update pricing failed: Pricing not found - ${subscription_pricing_id}`);
        throw new NotFoundException('Pricing not found');
      }

      const pricing = await prisma.subscriptionPricing.update({
        where: { id: subscription_pricing_id },
        data: {
          duration: pricingData.duration,
          price: pricingData.price,
          discount: pricingData.discount,
        },
      });
      
      logger.info(`Subscription pricing updated successfully: ${pricing.duration} (${subscription_pricing_id})`);
      return { ...pricing, duration: pricing.duration as PlanDuration };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update subscription pricing error for ${subscription_pricing_id}: ${error.message}`);
      throw error;
    }
  }

  // ACTIVE/DEACTIVE SUBSCRIPTION PLAN - Toggle plan status
  public async activeDeactiveSubscriptionPlan(plan_id: string, is_active: boolean): Promise<ISubscriptionPlan> {
    try {
      const isExistPlan = await prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
      });

      if (!isExistPlan) {
        logger.warn(`Toggle plan status failed: Plan not found - ${plan_id}`);
        throw new NotFoundException('Plan not found');
      }
      
      const plan = await prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          is_active: is_active,
        },
      });

      await prisma.subscriptionPricing.updateMany({
        where: { plan_id: plan_id },
        data: {
          is_active: is_active,
        },
      });

      logger.info(`Subscription plan ${is_active ? 'activated' : 'deactivated'} successfully: ${plan.plan_name} (${plan_id})`);
      return { ...plan, plan_name: plan.plan_name as SubscriptionPlanName };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Toggle plan status error for ${plan_id}: ${error.message}`);
      throw error;
    }
  }
}
