import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { IVehiclePayment, PaymentMethod } from '@/interfaces/vehiclePayment.interface';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';
import { PaymentStatus } from '@/interfaces/vehiclePayment.interface';

@Service()
export class PaymentService {
  private prisma = prisma;

  // Create
  public async createVehiclePayment(paymentData: IVehiclePayment): Promise<IVehiclePayment> {
    try {
      const payment = await this.prisma.vehiclePayment.create({
        data: {
          id: ulid(),
          amount: paymentData.amount,
          method: paymentData.method,
          status: paymentData.status,
          payment_receipt_images: paymentData.payment_receipt_images,
          message: paymentData.message,
          ...paymentData,
          customer_id: paymentData.customer_id,
          vehicle_id: paymentData.vehicle_id,
        },
      });

      return { ...payment, status: payment.status as PaymentStatus, method: payment.method as PaymentMethod };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) throw formatPrismaError(error);
      throw new HttpException(500, `Error creating payment: ${error.message}`);
    }
  }

  // Get all
  public async getAllVehiclePayments(pageNumber: number, pageSize: number): Promise<{ payments: IVehiclePayment[]; paymentCount: number }> {
    try {
      const skip = (pageNumber - 1) * pageSize;
      const payments = await this.prisma.vehiclePayment.findMany({
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        include: { vehicle: true, customer: true },
      });
      const paymentCount = await this.prisma.vehiclePayment.count({ where: { is_deleted: false } });
      return {
        payments: payments.map(payment => ({
          ...payment,
          method: payment.method as PaymentMethod,
          status: payment.status as PaymentStatus,
        })),
        paymentCount: paymentCount,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching payments: ${error.message}`);
    }
  }

  // Get by ID
  public async getVehiclePaymentById(id: string): Promise<IVehiclePayment> {
    try {
      const payment = await this.prisma.vehiclePayment.findFirst({
        where: { id, is_deleted: false },
        include: { vehicle: true, customer: true },
      });
      if (!payment) throw new HttpException(404, 'Payment not found');
      return { ...payment, status: payment.status as PaymentStatus, method: payment.method as PaymentMethod };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching payment: ${error.message}`);
    }
  }

  public async getAllPaymentsByVehicleId(vehicle_id: string): Promise<IVehiclePayment[]> {
    try {
      const payments = await this.prisma.vehiclePayment.findMany({
        where: { vehicle_id, is_deleted: false },
      });
      return payments.map(payment => ({
        ...payment,
        method: payment.method as PaymentMethod,
        status: payment.status as PaymentStatus,
      }));
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching payment by vehicle id: ${error.message}`);
    }
  }

  // Update
  public async updateVehiclePayment(id: string, paymentData: Partial<IVehiclePayment>): Promise<IVehiclePayment> {
    try {
      const payment = await this.prisma.vehiclePayment.update({
        where: { id },
        data: {
          ...paymentData,
        },
      });

      return { ...payment, status: payment.status as PaymentStatus, method: payment.method as PaymentMethod };
    } catch (error: any) {
      if (error.code === 'P2025') throw new HttpException(404, 'Payment not found');
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error updating payment: ${error.message}`);
    }
  }

  // Delete
  public async deleteVehiclePayment(id: string): Promise<any> {
    try {
      const payment = await this.prisma.vehiclePayment.findUnique({ where: { id } });
      if (!payment) throw new HttpException(404, 'Payment not found');
      await this.prisma.vehiclePayment.update({ where: { id }, data: { is_deleted: true } });
      return true;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error deleting payment: ${error.message}`);
    }
  }
}
