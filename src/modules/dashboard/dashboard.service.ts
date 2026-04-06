import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions';
import prisma from '@/lib/prisma';
import { formatPrismaError } from '@/exceptions/prismaException';
import type { DashboardStats } from './dashboard.interface';

@Service()
export class DashboardService {
  private prisma = prisma;

  public async getShopDashboardStats(shop_id: string): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

      // Total Vehicles Stats - Optimized with parallel queries
      const [
        currentMonthVehicles,
        lastMonthVehicles,
        totalVehicles,
        vehicleStatusCounts
      ] = await Promise.all([
        this.prisma.vehicle.count({
          where: {
            shop_id,
            deleted_at: null,
            created_at: { gte: startOfCurrentMonth }
          }
        }),
        this.prisma.vehicle.count({
          where: {
            shop_id,
            deleted_at: null,
            created_at: {
              gte: startOfLastMonth,
              lt: startOfCurrentMonth
            }
          }
        }),
        this.prisma.vehicle.count({
          where: { shop_id, deleted_at: null }
        }),
        // Get vehicle status breakdowns in parallel
        Promise.all([
          this.prisma.vehicle.count({ where: { shop_id, deleted_at: null, status: 'AVAILABLE' } }),
          this.prisma.vehicle.count({ where: { shop_id, deleted_at: null, status: 'SOLD' } }),
          this.prisma.vehicle.count({ where: { shop_id, deleted_at: null, status: 'MAINTENANCE' } }),
          this.prisma.vehicle.count({ where: { shop_id, deleted_at: null, status: { in: ['BOOKED', 'ON_HOLD'] } } })
        ])
      ]);

      const [availableVehicles, soldVehicles, maintenanceVehicles, reservedVehicles] = vehicleStatusCounts;

      const vehiclePercentageChange = lastMonthVehicles > 0 
        ? Math.round(((currentMonthVehicles - lastMonthVehicles) / lastMonthVehicles) * 100)
        : 100;

      // Total Customers Stats - Optimized with parallel queries
      const [
        currentMonthCustomers,
        lastMonthCustomers,
        totalCustomers,
        customerTypeCounts
      ] = await Promise.all([
        this.prisma.customer.count({
          where: {
            shop_id,
            deleted_at: null,
            created_at: { gte: startOfCurrentMonth }
          }
        }),
        this.prisma.customer.count({
          where: {
            shop_id,
            deleted_at: null,
            created_at: {
              gte: startOfLastMonth,
              lt: startOfCurrentMonth
            }
          }
        }),
        this.prisma.customer.count({
          where: { shop_id, deleted_at: null }
        }),
        // Get customer type breakdowns in parallel
        Promise.all([
          this.prisma.customer.count({ where: { shop_id, deleted_at: null, customer_type: 'BUYER' } }),
          this.prisma.customer.count({ where: { shop_id, deleted_at: null, customer_type: 'SELLER' } }),
          this.prisma.customer.count({ where: { shop_id, deleted_at: null, customer_type: 'BOTH' } })
        ])
      ]);

      const [buyerCount, sellerCount, bothCount] = customerTypeCounts;

      const customerPercentageChange = lastMonthCustomers > 0
        ? Math.round(((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
        : 100;

      // Service Status & Upcoming Services - Optimized with parallel queries
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const weekEnd = new Date(todayStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [
        completedServices,
        inProgressServices,
        pendingServices,
        upcomingServicesData
      ] = await Promise.all([
        this.prisma.servicing.count({
          where: {
            shop_id,
            deleted_at: null,
            status: 'COMPLETED'
          }
        }),
        this.prisma.servicing.count({
          where: {
            shop_id,
            deleted_at: null,
            status: 'IN_PROGRESS'
          }
        }),
        this.prisma.servicing.count({
          where: {
            shop_id,
            deleted_at: null,
            status: 'PENDING'
          }
        }),
        // Get upcoming services breakdowns
        Promise.all([
          this.prisma.servicing.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['SCHEDULED', 'PENDING', 'IN_PROGRESS'] },
              service_date: { gte: todayStart, lte: todayEnd }
            }
          }),
          this.prisma.servicing.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['SCHEDULED', 'PENDING', 'IN_PROGRESS'] },
              service_date: { gte: todayStart, lte: weekEnd }
            }
          }),
          this.prisma.servicing.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['SCHEDULED', 'PENDING', 'IN_PROGRESS'] },
              service_date: { lt: todayStart }
            }
          }),
          this.prisma.servicing.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['SCHEDULED', 'PENDING', 'IN_PROGRESS'] }
            }
          })
        ])
      ]);

      const [scheduledToday, scheduledThisWeek, overdueServices, totalUpcoming] = upcomingServicesData;

      // Monthly Revenue - Optimized with parallel queries
      const [currentMonthPayments, lastMonthPayments] = await Promise.all([
        this.prisma.vehiclePayment.aggregate({
          where: {
            shop_id,
            deleted_at: null,
            status: 'COMPLETED',
            created_at: { gte: startOfCurrentMonth }
          },
          _sum: { amount: true }
        }),
        this.prisma.vehiclePayment.aggregate({
          where: {
            shop_id,
            deleted_at: null,
            status: 'COMPLETED',
            created_at: {
              gte: startOfLastMonth,
              lt: startOfCurrentMonth
            }
          },
          _sum: { amount: true }
        })
      ]);

      const currentMonthRevenue = currentMonthPayments._sum.amount || 0;
      const lastMonthRevenue = lastMonthPayments._sum.amount || 0;

      const revenuePercentageChange = lastMonthRevenue > 0
        ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 100;

      // Determine revenue trend
      const revenueTrend: 'up' | 'down' | 'stable' = 
        revenuePercentageChange > 5 ? 'up' : 
        revenuePercentageChange < -5 ? 'down' : 
        'stable';

      // Total Revenue (All Time) - Optimized with parallel queries
      const [totalRevenueData, currentYearRevenue, lastYearRevenue] = await Promise.all([
        this.prisma.vehiclePayment.aggregate({
          where: {
            shop_id,
            deleted_at: null,
            status: 'COMPLETED'
          },
          _sum: { amount: true }
        }),
        this.prisma.vehiclePayment.aggregate({
          where: {
            shop_id,
            deleted_at: null,
            status: 'COMPLETED',
            created_at: { gte: startOfYear }
          },
          _sum: { amount: true }
        }),
        this.prisma.vehiclePayment.aggregate({
          where: {
            shop_id,
            deleted_at: null,
            status: 'COMPLETED',
            created_at: {
              gte: startOfLastYear,
              lte: endOfLastYear
            }
          },
          _sum: { amount: true }
        })
      ]);

      const totalRevenue = totalRevenueData._sum.amount || 0;
      const currentYearTotal = currentYearRevenue._sum.amount || 0;
      const lastYearTotal = lastYearRevenue._sum.amount || 0;

      const yearlyRevenueChange = lastYearTotal > 0
        ? Math.round(((currentYearTotal - lastYearTotal) / lastYearTotal) * 100)
        : 100;

      // Pending Inquiries - Optimized
      const [inquiryStats, recentServices, recentVehicles, recentCustomers] = await Promise.all([
        Promise.all([
          this.prisma.inquiry.count({
            where: {
              shop_id,
              deleted_at: null,
              status: 'NEW'
            }
          }),
          this.prisma.inquiry.count({
            where: {
              shop_id,
              deleted_at: null,
              status: 'FOLLOW_UP',
              follow_up_date: { lte: now }
            }
          }),
          this.prisma.inquiry.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['NEW', 'CONTACTED', 'FOLLOW_UP'] },
              priority: { in: ['HIGH', 'URGENT'] }
            }
          }),
          this.prisma.inquiry.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['NEW', 'CONTACTED', 'FOLLOW_UP'] },
              priority: 'LOW'
            }
          }),
          this.prisma.inquiry.count({
            where: {
              shop_id,
              deleted_at: null,
              status: { in: ['NEW', 'CONTACTED', 'FOLLOW_UP'] }
            }
          })
        ]),
        // Recent Activities - Optimized with parallel queries
        this.prisma.servicing.findMany({
          where: { shop_id, deleted_at: null },
          include: {
            customer: true
          },
          orderBy: { service_date: 'desc' },
          take: 10
        }),
        this.prisma.vehicle.findMany({
          where: { shop_id, deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 5
        }),
        this.prisma.customer.findMany({
          where: { shop_id, deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 5
        })
      ]);

      const [newLeads, followUpsDue, hotLeads, coldLeads, totalInquiries] = inquiryStats;

      // Combine and format activities
      const activities: Array<any> = [];

      recentServices.forEach(service => {
        const timeDiff = now.getTime() - service.service_date.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        let timeString = '';
        if (hoursAgo < 1) {
          timeString = 'Just now';
        } else if (hoursAgo < 24) {
          timeString = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          timeString = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        }

        let type: any = 'service_in_progress';
        let status: any = 'in_progress';

        if (service.status === 'COMPLETED') {
          type = 'service_completed';
          status = 'completed';
        } else if (service.status === 'PENDING') {
          type = 'service_pending';
          status = 'pending';
        }

        activities.push({
          id: service.id,
          type,
          message: `${service.status === 'COMPLETED' ? 'Bike service completed' : service.status === 'PENDING' ? 'Service pending' : 'Service in progress'} for ${service.vehicle_brand} ${service.vehicle_model}`,
          timestamp: service.service_date,
          timeString,
          status
        });
      });

      recentVehicles.forEach(vehicle => {
        const timeDiff = now.getTime() - vehicle.created_at.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        
        if (hoursAgo < 48) {
          activities.push({
            id: vehicle.id,
            type: 'vehicle_registered',
            message: `New bike registered - ${vehicle.brand} ${vehicle.model}`,
            timestamp: vehicle.created_at,
            timeString: `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`,
            status: 'completed'
          });
        }
      });

      recentCustomers.forEach(customer => {
        const timeDiff = now.getTime() - customer.created_at.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        
        if (hoursAgo < 48) {
          activities.push({
            id: customer.id,
            type: 'customer_registered',
            message: `New customer registered - ${customer.name}`,
            timestamp: customer.created_at,
            timeString: `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`,
            status: 'completed'
          });
        }
      });

      // Sort activities by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Get unique cities from customer addresses (simplified) - Optimized
      const customers = await this.prisma.customer.findMany({
        where: { shop_id, deleted_at: null },
        select: { city: true }
      });

      const cities = Array.from(new Set(
        customers
          .map(c => c.city)
          .filter(city => city && city.length > 0)
      )).slice(0, 5);

      // Calculate customer growth trend
      const customerGrowthTrend = lastMonthCustomers > 0
        ? Math.round(((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
        : 0;

      return {
        totalVehicles: {
          count: totalVehicles,
          percentageChange: vehiclePercentageChange,
          available: availableVehicles,
          sold: soldVehicles,
          inMaintenance: maintenanceVehicles,
          reserved: reservedVehicles
        },
        totalCustomers: {
          count: totalCustomers,
          percentageChange: customerPercentageChange,
          buyers: buyerCount,
          sellers: sellerCount,
          both: bothCount,
          growthTrend: customerGrowthTrend
        },
        monthlyRevenue: {
          amount: Math.round(currentMonthRevenue),
          percentageChange: revenuePercentageChange,
          lastMonthAmount: Math.round(lastMonthRevenue),
          trend: revenueTrend
          // monthlyTarget and targetProgress can be added from shop settings
        },
        pendingInquiries: {
          total: totalInquiries,
          newLeads: newLeads,
          followUpsDue: followUpsDue,
          hotLeads: hotLeads,
          coldLeads: coldLeads
        },
        upcomingServices: {
          total: totalUpcoming,
          scheduledToday: scheduledToday,
          thisWeek: scheduledThisWeek,
          overdue: overdueServices,
          remindersSent: 0 // Can be implemented with notification tracking
        },
        activeServices: {
          count: inProgressServices,
          status: 'In progress'
        },
        serviceStatus: {
          completed: completedServices,
          inProgress: inProgressServices,
          pending: pendingServices
        },
        totalRevenue: {
          amount: Math.round(totalRevenue),
          yearlyPercentageChange: yearlyRevenueChange,
          description: 'All time earnings'
        },
        activeLocations: {
          count: cities.length || 1,
          description: 'Service centers',
          cities
        },
        recentActivities: activities.slice(0, 10).map(activity => ({
          id: activity.id,
          type: activity.type,
          message: activity.message,
          timestamp: activity.timestamp,
          timeString: activity.timeString,
          status: activity.status
        }))
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Get Shop stats service: ${error.message}`);
    }
  }

  /**
   * Sales trend for last N days (SOLD vehicles)
   */
  public async getSalesTrend(shop_id: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [sales, previousSales] = await Promise.all([
        this.prisma.vehicle.findMany({
          where: {
            shop_id,
            deleted_at: null,
            status: 'SOLD',
            selling_date: { gte: startDate, lte: endDate },
          },
          select: { selling_date: true, selling_price: true },
        }),
        this.prisma.vehicle.findMany({
          where: {
            shop_id,
            deleted_at: null,
            status: 'SOLD',
            selling_date: {
              gte: new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000),
              lt: startDate,
            },
          },
          select: { selling_date: true, selling_price: true },
        }),
      ]);

      const salesByDate: Record<string, { count: number; revenue: number }> = {};
      const previousByDate: Record<string, { count: number; revenue: number }> = {};

      for (const s of sales) {
        if (!s.selling_date) continue;
        const key = s.selling_date.toISOString().split('T')[0];
        salesByDate[key] ||= { count: 0, revenue: 0 };
        salesByDate[key].count += 1;
        salesByDate[key].revenue += s.selling_price || 0;
      }

      for (const s of previousSales) {
        if (!s.selling_date) continue;
        const key = s.selling_date.toISOString().split('T')[0];
        previousByDate[key] ||= { count: 0, revenue: 0 };
        previousByDate[key].count += 1;
        previousByDate[key].revenue += s.selling_price || 0;
      }

      const result: Array<{
        date: string;
        salesCount: number;
        revenue: number;
        previousPeriodSales: number;
        previousPeriodRevenue: number;
      }> = [];

      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];

        const prev = new Date(d);
        prev.setDate(prev.getDate() - days);
        const prevKey = prev.toISOString().split('T')[0];

        result.push({
          date: key,
          salesCount: salesByDate[key]?.count || 0,
          revenue: Math.round(salesByDate[key]?.revenue || 0),
          previousPeriodSales: previousByDate[prevKey]?.count || 0,
          previousPeriodRevenue: Math.round(previousByDate[prevKey]?.revenue || 0),
        });
      }

      return result;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Get sales trend error: ${error.message}`);
    }
  }

  /**
   * Revenue by vehicle type (from COMPLETED payments)
   */
  public async getRevenueByVehicleType(shop_id: string) {
    try {
      const payments = await this.prisma.vehiclePayment.findMany({
        where: { shop_id, deleted_at: null, status: 'COMPLETED' },
        include: { vehicle: { select: { type: true } } },
      });

      const byType: Record<string, { revenue: number; count: number }> = {};
      let total = 0;

      for (const p of payments) {
        const type = p.vehicle.type;
        byType[type] ||= { revenue: 0, count: 0 };
        byType[type].revenue += p.amount;
        byType[type].count += 1;
        total += p.amount;
      }

      return Object.entries(byType).map(([type, v]) => ({
        type,
        revenue: Math.round(v.revenue),
        percentage: total > 0 ? Math.round((v.revenue / total) * 1000) / 10 : 0,
        count: v.count,
      }));
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Get revenue by type error: ${error.message}`);
    }
  }

  /**
   * Top selling brands (by SOLD vehicles)
   */
  public async getTopSellingBrands(shop_id: string, limit: number = 10) {
    try {
      const sold = await this.prisma.vehicle.findMany({
        where: { shop_id, deleted_at: null, status: 'SOLD' },
        select: { brand: true, selling_price: true },
      });

      const stats: Record<string, { unitsSold: number; totalRevenue: number }> = {};
      for (const v of sold) {
        stats[v.brand] ||= { unitsSold: 0, totalRevenue: 0 };
        stats[v.brand].unitsSold += 1;
        stats[v.brand].totalRevenue += v.selling_price || 0;
      }

      return Object.entries(stats)
        .map(([brand, s]) => ({ brand, unitsSold: s.unitsSold, totalRevenue: Math.round(s.totalRevenue) }))
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, limit);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Get top brands error: ${error.message}`);
    }
  }

  /**
   * Payment method distribution (from COMPLETED payments)
   */
  public async getPaymentMethodDistribution(shop_id: string) {
    try {
      const payments = await this.prisma.vehiclePayment.findMany({
        where: { shop_id, deleted_at: null, status: 'COMPLETED' },
        select: { method: true, amount: true },
      });

      const byMethod: Record<string, { count: number; amount: number }> = {};
      let totalAmount = 0;

      for (const p of payments) {
        byMethod[p.method] ||= { count: 0, amount: 0 };
        byMethod[p.method].count += 1;
        byMethod[p.method].amount += p.amount;
        totalAmount += p.amount;
      }

      return Object.entries(byMethod).map(([method, s]) => ({
        method,
        count: s.count,
        amount: Math.round(s.amount),
        percentage: totalAmount > 0 ? Math.round((s.amount / totalAmount) * 1000) / 10 : 0,
      }));
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Get payment distribution error: ${error.message}`);
    }
  }
}