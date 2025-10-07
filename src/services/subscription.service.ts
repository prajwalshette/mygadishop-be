import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';

@Service()
export class Service {
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
}