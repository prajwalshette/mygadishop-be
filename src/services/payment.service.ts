import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import prisma from '@/lib/prisma';
import { IVehiclePayment, PaymentMethod, PaymentType } from '@/interfaces/vehiclePayment.interface';
import { ulid } from 'ulid';
import { PaymentStatus } from '@/interfaces/vehiclePayment.interface';
import { CreateVehiclePaymentDto, UpdateVehiclePaymentDto, GetAllPaymentsQueryDto, ExportPaymentsQueryDto } from '@/schemas/payment.schema';
import { logger } from '@utils/logger';

@Service()
export class PaymentService {
  private prisma = prisma;

  // -----------------------------
  // CREATE VEHICLE PAYMENT - Create new payment record
  // -----------------------------
  public async createVehiclePayment(paymentData: CreateVehiclePaymentDto): Promise<IVehiclePayment> {
    try {
      const payment = await this.prisma.vehiclePayment.create({
        data: {
          id: ulid(),
          shop_id: paymentData.shop_id,
          vehicle_id: paymentData.vehicle_id,
          customer_id: paymentData.customer_id,
          amount: paymentData.amount,
          paid_amount: paymentData.paid_amount,
          balance_due: paymentData.balance_due,
          payment_type: paymentData.payment_type,
          method: paymentData.method,
          status: paymentData.status,
          transaction_id: paymentData.transaction_id,
          payment_receipt_images: paymentData.payment_receipt_images || [],
          notes: paymentData.notes,
        },
      });

      logger.info(`Payment created successfully: ${payment.id}`);
      return {
        ...payment,
        status: payment.status as PaymentStatus,
        method: payment.method as PaymentMethod,
        payment_type: payment.payment_type as PaymentType,
        deleted_at: payment.deleted_at,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create payment error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET ALL VEHICLE PAYMENTS - Retrieve paginated payment list
  // -----------------------------
  public async getAllVehiclePayments(query: GetAllPaymentsQueryDto, shop_id?: string): Promise<any> {
    try {
      const { page, limit } = query;
      const skip = (page - 1) * limit;
      const whereClause: any = { deleted_at: null };
      if (shop_id) {
        whereClause.shop_id = shop_id;
      }
      const payments = await this.prisma.vehiclePayment.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: { vehicle: true, customer: true },
      });
      const paymentCount = await this.prisma.vehiclePayment.count({ where: whereClause });

      logger.info(`Retrieved ${paymentCount} payments (page ${page}, limit ${limit})`);
      return {
        payments: payments.map(payment => ({
          ...payment,
          method: payment.method as PaymentMethod,
          status: payment.status as PaymentStatus,
          payment_type: payment.payment_type as PaymentType,
          deleted_at: payment.deleted_at,
        })),
        pagination: {
          page: page,
          limit: limit,
          total: paymentCount,
          totalPages: Math.ceil(paymentCount / limit),
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get all payments error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // EXPORT PAYMENTS - Get all payments for CSV export (with filters, no pagination)
  // -----------------------------
  public async exportPayments(query: ExportPaymentsQueryDto, shop_id: string): Promise<any[]> {
    const { dateFrom, dateTo, status, payment_type, method, search } = query;
    try {
      const baseWhere: any = { shop_id, deleted_at: null };
      if (status) baseWhere.status = status;
      if (payment_type) baseWhere.payment_type = payment_type;
      if (method) baseWhere.method = method;
      if (dateFrom || dateTo) {
        baseWhere.payment_date = {};
        if (dateFrom) baseWhere.payment_date.gte = new Date(dateFrom);
        if (dateTo) baseWhere.payment_date.lte = new Date(dateTo);
      }
      const andConditions: any[] = [baseWhere];
      if (search && search.trim()) {
        const q = search.trim();
        andConditions.push({
          OR: [
            { vehicle: { registration_number: { contains: q, mode: 'insensitive' } } },
            { transaction_id: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
            { customer: { phone: { contains: q, mode: 'insensitive' } } },
            { notes: { contains: q, mode: 'insensitive' } },
          ],
        });
      }
      const whereClause = andConditions.length > 1 ? { AND: andConditions } : baseWhere;
      const payments = await this.prisma.vehiclePayment.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: { vehicle: true, customer: true },
      });
      logger.info(`Exporting ${payments.length} payments (filters: ${JSON.stringify({ dateFrom, dateTo, status, payment_type, method, search })})`);
      return payments.map(p => ({
        ...p,
        method: p.method as PaymentMethod,
        status: p.status as PaymentStatus,
        payment_type: p.payment_type as PaymentType,
      }));
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Export payments error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET VEHICLE PAYMENT BY ID - Retrieve single payment record
  // -----------------------------
  public async getVehiclePaymentById(id: string, shop_id?: string): Promise<IVehiclePayment> {
    try {
      const whereClause: any = { id, deleted_at: null };
      if (shop_id) {
        whereClause.shop_id = shop_id;
      }
      const payment = await this.prisma.vehiclePayment.findFirst({
        where: whereClause,
        include: { vehicle: true, customer: true },
      });

      if (!payment) {
        logger.warn(`Get payment failed: Payment not found - ${id}`);
        throw new NotFoundException('Payment not found');
      }

      logger.info(`Payment retrieved successfully: ${id}`);
      return {
        ...payment,
        status: payment.status as PaymentStatus,
        method: payment.method as PaymentMethod,
        payment_type: payment.payment_type as PaymentType,
        deleted_at: payment.deleted_at,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get payment error for ${id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET PAYMENTS BY VEHICLE ID - Retrieve all payments for a vehicle
  // -----------------------------
  public async getAllPaymentsByVehicleId(vehicle_id: string, shop_id?: string): Promise<IVehiclePayment[]> {
    try {
      const whereClause: any = { vehicle_id, deleted_at: null };
      if (shop_id) {
        whereClause.shop_id = shop_id;
      }
      const payments = await this.prisma.vehiclePayment.findMany({
        where: whereClause,
      });

      logger.info(`Retrieved ${payments.length} payments for vehicle: ${vehicle_id}`);
      return payments.map(payment => ({
        ...payment,
        method: payment.method as PaymentMethod,
        status: payment.status as PaymentStatus,
        payment_type: payment.payment_type as PaymentType,
      }));
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get payments by vehicle error for ${vehicle_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE VEHICLE PAYMENT - Modify existing payment record
  // -----------------------------
  public async updateVehiclePayment(id: string, paymentData: UpdateVehiclePaymentDto): Promise<IVehiclePayment> {
    try {
      const payment = await this.prisma.vehiclePayment.update({
        where: { id },
        data: {
          ...paymentData,
        },
      });

      logger.info(`Payment updated successfully: ${id}`);
      return {
        ...payment,
        status: payment.status as PaymentStatus,
        method: payment.method as PaymentMethod,
        payment_type: payment.payment_type as PaymentType,
        deleted_at: payment.deleted_at,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.code === 'P2025') {
        logger.warn(`Update payment failed: Payment not found - ${id}`);
        throw new NotFoundException('Payment not found');
      }
      logger.error(`Update payment error for ${id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE VEHICLE PAYMENT - Soft delete payment record
  // -----------------------------
  public async deleteVehiclePayment(id: string, shop_id?: string): Promise<any> {
    try {
      const whereClause: any = { id };
      if (shop_id) {
        whereClause.shop_id = shop_id;
      }
      const payment = await this.prisma.vehiclePayment.findFirst({ where: whereClause });

      if (!payment) {
        logger.warn(`Delete payment failed: Payment not found - ${id}`);
        throw new NotFoundException('Payment not found');
      }

      await this.prisma.vehiclePayment.update({ where: { id }, data: { deleted_at: new Date() } });

      logger.info(`Payment deleted successfully: ${id}`);
      return true;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete payment error for ${id}: ${error.message}`);
      throw error;
    }
  }
}
