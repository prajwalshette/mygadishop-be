import { ServicingStatus } from '@/interfaces/servicing.interface';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import prisma from '@/database';
import { IServicing } from '@/interfaces/servicing.interface';
import { ulid } from 'ulid';
import { logger } from '@utils/logger';
import { CreateServicingDto, UpdateServicingDto, GetServicingQueryDto, ExportServicingQueryDto } from '@/schemas/servicing.schema';

@Service()
export class ServicingService {
  private prisma = prisma;

  // -----------------------------
  // CREATE SERVICING - Create new servicing record
  // -----------------------------
  public async createServicing(data: IServicing): Promise<IServicing> {
    try {
      const newServicing = await this.prisma.servicing.create({
        data: {
          id: ulid(),
          shop_id: data.shop_id,
          vehicle_id: data.vehicle_id,
          customer_id: data.customer_id,
          service_date: data.service_date,
          service_type: data.service_type,
          description: data.description,
          labor_cost: data.labor_cost,
          parts_cost: data.parts_cost,
          total_cost: data.total_cost,
          status: data.status || ServicingStatus.PENDING,
          next_service_date: data.next_service_date,
        },
      });
      
      logger.info(`Servicing created successfully: ${newServicing.service_type} (${newServicing.id})`);
      return { ...newServicing, status: newServicing.status as ServicingStatus };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create servicing error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET ALL SERVICINGS - Retrieve paginated servicing list
  // -----------------------------
  public async getServicings(query: GetServicingQueryDto): Promise<any> {
    const { page, limit, search, status, vehicle_id, customer_id, sortBy, sortOrder } = query;
    
    try {
      const skip = (page - 1) * limit;

      // Build where clause with filters
      const whereClause: any = {};

      // Add search filter (searches across service_type and description)
      if (search) {
        whereClause.OR = [
          { service_type: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add vehicle_id filter
      if (vehicle_id) {
        whereClause.vehicle_id = vehicle_id;
      }

      // Add customer_id filter
      if (customer_id) {
        whereClause.customer_id = customer_id;
      }

      // Fetch servicings and total count in parallel using Promise.all
      const [servicings, total] = await Promise.all([
        this.prisma.servicing.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.servicing.count({ where: whereClause }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${total} servicings (page ${page}, limit ${limit}, filters: ${JSON.stringify({ search, status, vehicle_id, customer_id })})`);
      
      return {
        servicings: servicings.map(s => ({
          ...s,
          status: s.status as ServicingStatus,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get all servicings error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SERVICING BY ID - Retrieve single servicing record
  // -----------------------------
  public async getServicingById(id: string): Promise<IServicing> {
    try {
      const servicing = await this.prisma.servicing.findUnique({ where: { id } });
      
      if (!servicing) {
        logger.warn(`Get servicing failed: Servicing not found - ${id}`);
        throw new NotFoundException('Servicing not found');
      }
      
      logger.info(`Servicing retrieved successfully: ${id}`);
      return { ...servicing, status: servicing.status as ServicingStatus };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get servicing error for ${id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE SERVICING - Modify existing servicing record
  // -----------------------------
  public async updateServicing(id: string, data: Partial<IServicing>): Promise<IServicing> {
    try {
      const servicing = await this.prisma.servicing.update({
        where: { id },
        data: {
          ...data,
        },
      });
      
      logger.info(`Servicing updated successfully: ${id}`);
      return { ...servicing, status: servicing.status as ServicingStatus };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.code === 'P2025') {
        logger.warn(`Update servicing failed: Servicing not found - ${id}`);
        throw new NotFoundException('Servicing not found');
      }
      logger.error(`Update servicing error for ${id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET SERVICING STATISTICS - Get servicing stats for dashboard
  // -----------------------------
  public async getServicingStats(shop_id: string): Promise<any> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Total servicings
      const totalServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
        },
      });

      // Completed servicings
      const completedServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'COMPLETED',
        },
      });

      // In progress servicings
      const inProgressServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'IN_PROGRESS',
        },
      });

      // Scheduled servicings
      const scheduledServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'SCHEDULED',
        },
      });

      // New servicings this month
      const newThisMonth = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: { gte: startOfCurrentMonth },
        },
      });

      // Servicings from last month
      const lastMonthServicings = await this.prisma.servicing.count({
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
      const growthRate = lastMonthServicings > 0
        ? Math.round(((newThisMonth - lastMonthServicings) / lastMonthServicings) * 100)
        : (newThisMonth > 0 ? 100 : 0);

      logger.info(`Retrieved servicing stats for shop ${shop_id}: total=${totalServicings}, completed=${completedServicings}, inProgress=${inProgressServicings}, scheduled=${scheduledServicings}, newThisMonth=${newThisMonth}, growthRate=${growthRate}%`);

      return {
        totalServicings,
        completedServicings,
        inProgressServicings,
        scheduledServicings,
        newThisMonth,
        growthRate,
        lastMonthServicings,
      };
    } catch (error) {
      logger.error(`Get servicing stats error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // EXPORT SERVICINGS - Get all servicings for CSV export (no pagination)
  // -----------------------------
  public async exportServicings(query: ExportServicingQueryDto, shop_id: string): Promise<IServicing[]> {
    const { search, status, vehicle_id, customer_id, sortBy, sortOrder } = query;
    
    try {
      // Build where clause with filters
      const whereClause: any = {
        shop_id,
        deleted_at: null,
      };

      // Add search filter (searches across service_type and description)
      if (search) {
        whereClause.OR = [
          { service_type: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add vehicle_id filter
      if (vehicle_id) {
        whereClause.vehicle_id = vehicle_id;
      }

      // Add customer_id filter
      if (customer_id) {
        whereClause.customer_id = customer_id;
      }

      // Fetch all servicings without pagination
      const servicings = await this.prisma.servicing.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
      });

      logger.info(`Exporting ${servicings.length} servicings (filters: ${JSON.stringify({ search, status, vehicle_id, customer_id })})`);
      
      return servicings.map(servicing => ({
        ...servicing,
        status: servicing.status as ServicingStatus,
      }));
    } catch (error) {
      logger.error(`Export servicings error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE SERVICING - Soft delete servicing record
  // -----------------------------
  public async deleteServicing(id: string): Promise<any> {
    try {
      const servicing = await this.prisma.servicing.update({ where: { id }, data: { deleted_at: new Date() } });
      
      logger.info(`Servicing deleted successfully: ${id}`);
      return true;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.code === 'P2025') {
        logger.warn(`Delete servicing failed: Servicing not found - ${id}`);
        throw new NotFoundException('Servicing not found');
      }
      logger.error(`Delete servicing error for ${id}: ${error.message}`);
      throw error;
    }
  }
}
