import { Service } from 'typedi';
import { CustomerType, PaymentStatus, Prisma, ServicingStatus } from '@prisma/client';
import { HttpException, NotFoundException } from '@/exceptions';
import prisma from '@/lib/prisma';
import type { IServicing } from './servicing.interface';
import { ulid } from 'ulid';
import { logger } from '@/utils/logger';
import type { CreateServicingDto, ExportServicingQueryDto, GetServicingQueryDto, UpdateServicingDto } from './servicing.validator';

type ServicingWithCustomer = Prisma.ServicingGetPayload<{
  include: { customer: { select: { name: true; phone: true } } };
}>;

function mapServicingWithCustomer(s: ServicingWithCustomer): IServicing {
  const { customer, ...rest } = s;
  return {
    ...rest,
    customer_name: customer?.name ?? null,
    customer_phone: customer?.phone ?? null,
  } as IServicing;
}

function buildServicingSearchOr(search: string): Prisma.ServicingWhereInput[] {
  return [
    { service_type: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
    { vehicle_brand: { contains: search, mode: 'insensitive' } },
    { vehicle_model: { contains: search, mode: 'insensitive' } },
    { vehicle_reg_number: { contains: search, mode: 'insensitive' } },
    {
      customer: {
        deleted_at: null,
        name: { contains: search, mode: 'insensitive' },
      },
    },
    {
      customer: {
        deleted_at: null,
        phone: { contains: search, mode: 'insensitive' },
      },
    },
  ];
}

@Service()
export class ServicingService {
  private prisma = prisma;

  // -----------------------------
  // CREATE SERVICING
  // -----------------------------
  public async createServicing(shop_id: string, data: CreateServicingDto): Promise<IServicing> {
    try {
      const customer_id = await this.resolveCustomerForServicing(shop_id, data);

      const newServicing = await this.prisma.servicing.create({
        data: {
          id: ulid(),
          shop_id,
          customer_id,
          vehicle_brand: data.vehicle_brand,
          vehicle_model: data.vehicle_model,
          vehicle_variant: data.vehicle_variant ?? null,
          vehicle_year: data.vehicle_year ?? null,
          vehicle_type: data.vehicle_type,
          vehicle_reg_number: data.vehicle_reg_number ?? null,
          service_date: data.service_date,
          service_type: data.service_type,
          description: data.description ?? null,
          parts_replaced: data.parts_replaced ?? [],
          labor_cost: data.labor_cost,
          parts_cost: data.parts_cost,
          other_charges: data.other_charges ?? 0,
          total_cost: data.total_cost,
          status: data.status,
          next_service_date: data.next_service_date ?? null,
          next_service_km: data.next_service_km ?? null,
          technician_name: data.technician_name ?? null,
          odometer_reading: data.odometer_reading ?? null,
          rating: data.rating ?? null,
          customer_feedback: data.customer_feedback ?? null,
          payment_status: data.payment_status ?? PaymentStatus.PENDING,
          paid_amount: data.paid_amount ?? 0,
          payment_method: data.payment_method ?? null,
          payment_date: data.payment_date ?? null,
          service_images: data.service_images ?? [],
        },
      });

      logger.info(`Servicing created successfully: ${newServicing.service_type} (${newServicing.id})`);
      return newServicing as IServicing;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create servicing error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Uses existing customer_id when provided; otherwise finds by phone or creates
   * a SERVICE_ONLY customer with the given name and phone.
   */
  private async resolveCustomerForServicing(shop_id: string, data: CreateServicingDto): Promise<string> {
    if (data.customer_id) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: data.customer_id, shop_id, deleted_at: null },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      return data.customer_id;
    }

    const name = data.customer_name!.trim();
    const phone = data.customer_phone!;

    const existing = await this.prisma.customer.findFirst({
      where: { shop_id, phone, deleted_at: null },
    });
    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.customer.create({
      data: {
        id: ulid(),
        shop_id,
        name,
        phone,
        customer_type: CustomerType.SERVICE_ONLY,
      },
    });
    return created.id;
  }

  // -----------------------------
  // GET ALL SERVICINGS (scoped to shop)
  // -----------------------------
  public async getServicings(query: GetServicingQueryDto, shop_id: string): Promise<any> {
    const { page, limit, search, status, vehicle_reg_number, customer_id, sortBy, sortOrder } = query;

    try {
      const skip = (page - 1) * limit;

      const whereClause: Prisma.ServicingWhereInput = {
        shop_id,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = buildServicingSearchOr(search);
      }

      if (status) {
        whereClause.status = status;
      }

      if (vehicle_reg_number) {
        whereClause.vehicle_reg_number = { contains: vehicle_reg_number, mode: 'insensitive' };
      }

      if (customer_id) {
        whereClause.customer_id = customer_id;
      }

      const [rows, total] = await Promise.all([
        this.prisma.servicing.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            customer: {
              select: { name: true, phone: true },
            },
          },
        }),
        this.prisma.servicing.count({ where: whereClause }),
      ]);

      const servicings = rows.map(row => mapServicingWithCustomer(row));

      const totalPages = Math.ceil(total / limit);

      logger.info(
        `Retrieved ${total} servicings (page ${page}, limit ${limit}, filters: ${JSON.stringify({
          search,
          status,
          vehicle_reg_number,
          customer_id,
        })})`,
      );

      return {
        servicings,
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
  // GET SERVICING BY ID (scoped to shop)
  // -----------------------------
  public async getServicingById(id: string, shop_id: string): Promise<IServicing> {
    try {
      const row = await this.prisma.servicing.findFirst({
        where: { id, shop_id, deleted_at: null },
        include: {
          customer: {
            select: { name: true, phone: true },
          },
        },
      });

      if (!row) {
        logger.warn(`Get servicing failed: Servicing not found - ${id}`);
        throw new NotFoundException('Servicing not found');
      }

      logger.info(`Servicing retrieved successfully: ${id}`);
      return mapServicingWithCustomer(row);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get servicing error for ${id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE SERVICING
  // -----------------------------
  public async updateServicing(id: string, shop_id: string, data: UpdateServicingDto): Promise<IServicing> {
    try {
      const existing = await this.prisma.servicing.findFirst({
        where: { id, shop_id, deleted_at: null },
      });
      if (!existing) {
        throw new NotFoundException('Servicing not found');
      }

      const payload = stripUndefined(data) as Prisma.ServicingUpdateInput;

      const servicing = await this.prisma.servicing.update({
        where: { id },
        data: payload,
      });

      logger.info(`Servicing updated successfully: ${id}`);
      return servicing as IServicing;
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
  // GET SERVICING STATISTICS
  // -----------------------------
  public async getServicingStats(shop_id: string): Promise<any> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const totalServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
        },
      });

      const completedServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          status: ServicingStatus.COMPLETED,
        },
      });

      const inProgressServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          status: ServicingStatus.IN_PROGRESS,
        },
      });

      const scheduledServicings = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          status: ServicingStatus.SCHEDULED,
        },
      });

      const newThisMonth = await this.prisma.servicing.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: { gte: startOfCurrentMonth },
        },
      });

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

      const growthRate =
        lastMonthServicings > 0 ? Math.round(((newThisMonth - lastMonthServicings) / lastMonthServicings) * 100) : newThisMonth > 0 ? 100 : 0;

      logger.info(
        `Retrieved servicing stats for shop ${shop_id}: total=${totalServicings}, completed=${completedServicings}, inProgress=${inProgressServicings}, scheduled=${scheduledServicings}, newThisMonth=${newThisMonth}, growthRate=${growthRate}%`,
      );

      return {
        totalServicings,
        completedServicings,
        inProgressServicings,
        scheduledServicings,
        newThisMonth,
        growthRate,
        lastMonthServicings,
      };
    } catch (error: any) {
      logger.error(`Get servicing stats error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // EXPORT SERVICINGS
  // -----------------------------
  public async exportServicings(query: ExportServicingQueryDto, shop_id: string): Promise<IServicing[]> {
    const { search, status, vehicle_reg_number, customer_id, sortBy, sortOrder } = query;

    try {
      const whereClause: Prisma.ServicingWhereInput = {
        shop_id,
        deleted_at: null,
      };

      if (search) {
        whereClause.OR = buildServicingSearchOr(search);
      }

      if (status) {
        whereClause.status = status;
      }

      if (vehicle_reg_number) {
        whereClause.vehicle_reg_number = { contains: vehicle_reg_number, mode: 'insensitive' };
      }

      if (customer_id) {
        whereClause.customer_id = customer_id;
      }

      const rows = await this.prisma.servicing.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { name: true, phone: true },
          },
        },
      });

      const servicings = rows.map(row => mapServicingWithCustomer(row));

      logger.info(
        `Exporting ${servicings.length} servicings (filters: ${JSON.stringify({
          search,
          status,
          vehicle_reg_number,
          customer_id,
        })})`,
      );

      return servicings;
    } catch (error: any) {
      logger.error(`Export servicings error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE SERVICING (soft)
  // -----------------------------
  public async deleteServicing(id: string, shop_id: string): Promise<boolean> {
    try {
      const existing = await this.prisma.servicing.findFirst({
        where: { id, shop_id, deleted_at: null },
      });
      if (!existing) {
        throw new NotFoundException('Servicing not found');
      }

      await this.prisma.servicing.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

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

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
