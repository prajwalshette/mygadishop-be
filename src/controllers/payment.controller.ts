import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { PaymentService } from '@/services/payment.service';
import { IVehiclePayment } from '@/interfaces/vehiclePayment.interface';
import { RequestWithAdmin } from '@/interfaces/auth.interface';
import { ulid } from 'ulid';
import { uploadVehiclePaymentMedia } from '@/services/aws.service';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';

export class PaymentController {
  public paymentService = Container.get(PaymentService);
  private prisma = prisma;

  // Create
  public createVehiclePayment = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiclePaymentData: IVehiclePayment = request.body;
      const payment_id = ulid();

      let payment_receipt_images: string[] = [];

      if (request.paymentReceiptFiles && request.paymentReceiptFiles.paymentReceiptFiles) {
        payment_receipt_images = await this.handleVehiclePaymentMediaUpload(request, response, vehiclePaymentData.vehicle_id, payment_id);
      }

      const vehiclePaymentDataWithMedia: IVehiclePayment = {
        ...vehiclePaymentData,
        id: payment_id,
        payment_receipt_images: payment_receipt_images,
      };

      const vehiclePayment = await this.paymentService.createVehiclePayment(vehiclePaymentDataWithMedia);
      response.status(201).json({ data: vehiclePayment, message: 'Vehicle Payment created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Get all
  public getAllVehiclePayments = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { page_number, page_size } = request.query;

      const pageNumber = page_number ? Number(page_number) : 1;
      const pageSize = page_size ? Number(page_size) : 5;

      const payments = await this.paymentService.getAllVehiclePayments(pageNumber, pageSize);

      response.status(200).json({ data: { ...payments }, message: 'Payments fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Get by ID
  public getVehiclePaymentById = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const payment = await this.paymentService.getVehiclePaymentById(id);
      response.status(200).json({ data: payment, message: 'Payment fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getAllPaymentsByVehicleId = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { vehicle_id } = request.params;
      const payment = await this.paymentService.getAllPaymentsByVehicleId(vehicle_id);
      response.status(200).json({ data: payment, message: 'Payment fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Update
  public updateVehiclePayment = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const vehiclePaymentData: Partial<IVehiclePayment> = request.body;

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

      const vehiclePaymentDataWithMedia: Partial<IVehiclePayment> = {
        ...vehiclePaymentData,
        payment_receipt_images: payment_receipt_images,
      };

      const updatedPayment = await this.paymentService.updateVehiclePayment(id, vehiclePaymentDataWithMedia);

      response.status(200).json({ data: updatedPayment, message: 'Payment updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Delete
  public deleteVehiclePayment = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const deletedPayment = await this.paymentService.deleteVehiclePayment(id);
      response.status(200).json({ data: deletedPayment, message: 'Payment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  private async handleVehiclePaymentMediaUpload(
    request: RequestWithAdmin,
    response: Response,
    vehicle_id: string,
    payment_id: string,
  ): Promise<string[]> {
    try {
      const files = request.paymentReceiptFiles.paymentReceiptFiles as Express.Multer.File[];
      const vehiclePaymentFilesUrls: string[] = [];

      for (const file of files) {
        const tempRequest = { ...request, file } as RequestWithAdmin;
        const uploadResult = await uploadVehiclePaymentMedia(tempRequest, response, 'file', vehicle_id, payment_id);
        vehiclePaymentFilesUrls.push(uploadResult.fileUrl);
      }

      return vehiclePaymentFilesUrls;
    } catch (uploadError: any) {
      throw new HttpException(500, `Failed to upload Vehicle Payment media: ${uploadError.message}`);
    }
  }
}
