import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import type { CreateVehiclePaymentDto, ExportPaymentsQueryDto, GetAllPaymentsQueryDto, UpdateVehiclePaymentDto } from './payment.validator';
import { PaymentService } from './payment.service';
import { ulid } from 'ulid';
import { uploadVehiclePaymentMedia } from '@/services/aws/aws.service';
import { HttpException, NotFoundException } from '@/exceptions';
import prisma from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';
import { logger } from '@/utils/logger';

export class PaymentController {
  public paymentService = Container.get(PaymentService);
  private prisma = prisma;

  // -----------------------------
  // CREATE VEHICLE PAYMENT - Create new vehicle payment
  // -----------------------------
  public createVehiclePayment = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiclePaymentData: CreateVehiclePaymentDto = request.body;
      const shop_id = request.shop_id || request.user.shop_id;
      const payment_id = ulid();

      let payment_receipt_images: string[] = [];

      if (request.paymentReceiptFiles && request.paymentReceiptFiles.paymentReceiptFiles) {
        payment_receipt_images = await this.handleVehiclePaymentMediaUpload(request, response, vehiclePaymentData.vehicle_id, payment_id);
      }

      const vehiclePaymentDataWithMedia: CreateVehiclePaymentDto = {
        ...vehiclePaymentData,
        shop_id: shop_id,
        payment_receipt_images: payment_receipt_images,
      };

      const vehiclePayment = await this.paymentService.createVehiclePayment(vehiclePaymentDataWithMedia);
      response.status(201).json({ data: vehiclePayment, message: 'Vehicle Payment created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET ALL VEHICLE PAYMENTS - Retrieve paginated payments list
  // -----------------------------
  public getAllVehiclePayments = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetAllPaymentsQueryDto = request.query as any;
      const shop_id = (request as RequestWithUser).shop_id || (request as RequestWithUser).user?.shop_id;
      const payments = await this.paymentService.getAllVehiclePayments(query, shop_id);

      response.status(200).json({ data: { ...payments }, message: 'Payments fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // EXPORT PAYMENTS TO CSV - Export payments data as CSV
  // -----------------------------
  public exportPaymentsToCSV = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = request.query as unknown as ExportPaymentsQueryDto;
      const shop_id = request.shop_id || request.user.shop_id;

      logger.info(`Export payments CSV requested by shop ${shop_id} with filters: ${JSON.stringify(query)}`);

      const payments = await this.paymentService.exportPayments(query, shop_id);

      if (payments.length === 0) {
        logger.warn(`No payments found for export with filters: ${JSON.stringify(query)}`);
        throw new NotFoundException('No payments found to export');
      }

      const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const columns = [
        'Payment Date',
        'Transaction ID',
        'Vehicle Reg No',
        'Customer Name',
        'Customer Phone',
        'Type',
        'Method',
        'Status',
        'Amount',
        'Paid',
        'Balance Due',
        'Notes',
        'Created On',
      ];

      const rows = payments.map((p: any) => [
        formatDate(p.payment_date),
        p.transaction_id || '',
        p.vehicle?.registration_number || '',
        p.customer?.name || '',
        p.customer?.phone || '',
        p.payment_type || '',
        p.method || '',
        p.status || '',
        p.amount?.toString() ?? '',
        p.paid_amount?.toString() ?? '',
        p.balance_due?.toString() ?? '',
        p.notes || '',
        formatDate(p.created_at),
      ]);

      const csv = stringify(rows, { header: true, columns, quoted: true });
      const filename = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET VEHICLE PAYMENT BY ID - Retrieve single payment record
  // -----------------------------
  public getVehiclePaymentById = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const shop_id = request.shop_id || request.user.shop_id;
      const payment = await this.paymentService.getVehiclePaymentById(id, shop_id);
      response.status(200).json({ data: payment, message: 'Payment fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET PAYMENTS BY VEHICLE - Retrieve payment list for a vehicle
  // -----------------------------
  public getAllPaymentsByVehicleId = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { vehicle_id } = request.params as { vehicle_id: string };
      const shop_id = request.shop_id || request.user.shop_id;
      const payment = await this.paymentService.getAllPaymentsByVehicleId(vehicle_id, shop_id);
      response.status(200).json({ data: payment, message: 'Payment fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UPDATE VEHICLE PAYMENT - Modify existing vehicle payment
  // -----------------------------
  public updateVehiclePayment = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const vehiclePaymentData: UpdateVehiclePaymentDto = request.body;
      const shop_id = request.shop_id || request.user.shop_id;

      const existingPayment = await this.prisma.vehiclePayment.findUnique({ where: { id } });
      if (!existingPayment) {
        throw new HttpException(404, `Vehicle Payment not found with id: ${id}`);
      }

      // Handle file uploads
      let payment_receipt_images: string[] = [...(existingPayment.payment_receipt_images || [])];

      // Upload new vehicle media files if present
      if (request.paymentReceiptFiles && request.paymentReceiptFiles.paymentReceiptFiles) {
        const newImageUrls = await this.handleVehiclePaymentMediaUpload(request, response, existingPayment.vehicle_id, id);

        // You can choose to append or replace existing images
        if (request.body.replaceImages === 'true') {
          payment_receipt_images = newImageUrls;
        } else {
          payment_receipt_images = [...payment_receipt_images, ...newImageUrls];
        }
      }

      const vehiclePaymentDataWithMedia: UpdateVehiclePaymentDto = {
        ...vehiclePaymentData,
        shop_id: shop_id,
        payment_receipt_images: payment_receipt_images,
      };

      const updatedPayment = await this.paymentService.updateVehiclePayment(id, vehiclePaymentDataWithMedia);

      response.status(200).json({ data: updatedPayment, message: 'Payment updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // DELETE VEHICLE PAYMENT - Soft delete vehicle payment
  // -----------------------------
  public deleteVehiclePayment = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const shop_id = request.shop_id || request.user.shop_id;
      const deletedPayment = await this.paymentService.deleteVehiclePayment(id, shop_id);
      response.status(200).json({ data: deletedPayment, message: 'Payment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  private async handleVehiclePaymentMediaUpload(
    request: RequestWithUser,
    response: Response,
    vehicle_id: string,
    payment_id: string,
  ): Promise<string[]> {
    try {
      const files = request.paymentReceiptFiles.paymentReceiptFiles as Express.Multer.File[];
      const vehiclePaymentFilesUrls: string[] = [];

      for (const file of files) {
        const tempRequest = { ...request, file } as RequestWithUser;
        const uploadResult = await uploadVehiclePaymentMedia(tempRequest, response, 'file', request.shop_id, vehicle_id, payment_id);
        vehiclePaymentFilesUrls.push(uploadResult.fileUrl);
      }

      return vehiclePaymentFilesUrls;
    } catch (uploadError: any) {
      throw new HttpException(500, `Failed to upload Vehicle Payment media: ${uploadError.message}`);
    }
  }
}
