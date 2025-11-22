import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { formatPrismaError } from '@/exceptions/prismaException';
import { DashboardStats } from '@/interfaces/dashboard.interface';

@Service()
export class DashboardService {
  private prisma = prisma;

  public async getShopDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

      // Total Vehicles Stats
      const [currentMonthVehicles, lastMonthVehicles] = await Promise.all([
        this.prisma.vehicle.count({
          where: {
            deleted_at: null,
            created_at: { gte: startOfCurrentMonth }
          }
        }),
        this.prisma.vehicle.count({
          where: {
            deleted_at: null,
            created_at: {
              gte: startOfLastMonth,
              lt: startOfCurrentMonth
            }
          }
        })
      ]);

      const totalVehicles = await this.prisma.vehicle.count({
        where: { deleted_at: null }
      });

      const vehiclePercentageChange = lastMonthVehicles > 0 
        ? Math.round(((currentMonthVehicles - lastMonthVehicles) / lastMonthVehicles) * 100)
        : 100;

      // Total Customers Stats
      const [currentMonthCustomers, lastMonthCustomers] = await Promise.all([
        this.prisma.customer.count({
          where: {
            deleted_at: null,
            created_at: { gte: startOfCurrentMonth }
          }
        }),
        this.prisma.customer.count({
          where: {
            deleted_at: null,
            created_at: {
              gte: startOfLastMonth,
              lt: startOfCurrentMonth
            }
          }
        })
      ]);

      const totalCustomers = await this.prisma.customer.count({
        where: { deleted_at: null }
      });

      const customerPercentageChange = lastMonthCustomers > 0
        ? Math.round(((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
        : 100;

      // Service Status
      const [completedServices, inProgressServices, pendingServices] = await Promise.all([
        this.prisma.servicing.count({
          where: {
            deleted_at: null,
            status: 'COMPLETED'
          }
        }),
        this.prisma.servicing.count({
          where: {
            deleted_at: null,
            status: 'IN_PROGRESS'
          }
        }),
        this.prisma.servicing.count({
          where: {
            deleted_at: null,
            status: 'PENDING'
          }
        })
      ]);

      // Monthly Revenue
      const currentMonthPayments = await this.prisma.vehiclePayment.aggregate({
        where: {
          deleted_at: null,
          status: 'COMPLETED',
          created_at: { gte: startOfCurrentMonth }
        },
        _sum: { amount: true }
      });

      const lastMonthPayments = await this.prisma.vehiclePayment.aggregate({
        where: {
          deleted_at: null,
          status: 'COMPLETED',
          created_at: {
            gte: startOfLastMonth,
            lt: startOfCurrentMonth
          }
        },
        _sum: { amount: true }
      });

      const currentMonthRevenue = currentMonthPayments._sum.amount || 0;
      const lastMonthRevenue = lastMonthPayments._sum.amount || 0;

      const revenuePercentageChange = lastMonthRevenue > 0
        ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 100;

      // Total Revenue (All Time)
      const totalRevenueData = await this.prisma.vehiclePayment.aggregate({
        where: {
          deleted_at: null,
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      });

      // Current Year Revenue
      const currentYearRevenue = await this.prisma.vehiclePayment.aggregate({
        where: {
          deleted_at: null,
          status: 'COMPLETED',
          created_at: { gte: startOfYear }
        },
        _sum: { amount: true }
      });

      // Last Year Revenue
      const lastYearRevenue = await this.prisma.vehiclePayment.aggregate({
        where: {
          deleted_at: null,
          status: 'COMPLETED',
          created_at: {
            gte: startOfLastYear,
            lte: endOfLastYear
          }
        },
        _sum: { amount: true }
      });

      const totalRevenue = totalRevenueData._sum.amount || 0;
      const currentYearTotal = currentYearRevenue._sum.amount || 0;
      const lastYearTotal = lastYearRevenue._sum.amount || 0;

      const yearlyRevenueChange = lastYearTotal > 0
        ? Math.round(((currentYearTotal - lastYearTotal) / lastYearTotal) * 100)
        : 100;

      // Recent Activities
      const recentServices = await this.prisma.servicing.findMany({
        where: { deleted_at: null },
        include: {
          vehicle: true,
          customer: true
        },
        orderBy: { service_date: 'desc' },
        take: 10
      });

      const recentVehicles = await this.prisma.vehicle.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 5
      });

      const recentCustomers = await this.prisma.customer.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 5
      });

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
          message: `${service.status === 'COMPLETED' ? 'Bike service completed' : service.status === 'PENDING' ? 'Service pending' : 'Service in progress'} for ${service.vehicle.brand} ${service.vehicle.model}`,
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

      // Get unique cities from customer addresses (simplified)
      const customers = await this.prisma.customer.findMany({
        where: { deleted_at: null },
        select: { address: true }
      });

      const cities = Array.from(new Set(
        customers
          .map(c => {
            const addressParts = c.address.split(',');
            return addressParts[addressParts.length - 1]?.trim() || '';
          })
          .filter(city => city.length > 0)
      )).slice(0, 5);

      return {
        totalVehicles: {
          count: totalVehicles,
          percentageChange: vehiclePercentageChange
        },
        totalCustomers: {
          count: totalCustomers,
          percentageChange: customerPercentageChange
        },
        activeServices: {
          count: inProgressServices,
          status: 'In progress'
        },
        monthlyRevenue: {
          amount: Math.round(currentMonthRevenue),
          percentageChange: revenuePercentageChange
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
}