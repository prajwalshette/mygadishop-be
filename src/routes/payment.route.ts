import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import multer from 'multer';
import { CreateVehiclePaymentDto, UpdateVehiclePaymentDto } from '@/dtos/payment.dto';

export class PaymentRoute implements Routes {
  public path = '/payment';
  public router = Router();
  public paymentController = new PaymentController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
        else cb(null, false);
      },
    });

    // 👉 Create Vehicle Payment
    this.router.post(
      `${this.path}/create-vehicle-payment`,
      [
        AuthMiddleware,
        upload.fields([{ name: 'paymentReceiptFiles', maxCount: 10 }]),
        ValidationMiddleware(CreateVehiclePaymentDto),
      ],
      this.paymentController.createVehiclePayment,
    );

    // 👉 Update Vehicle Payment
    this.router.put(
      `${this.path}update-vehicle-payment/:id`,
      [
        AuthMiddleware,
        upload.fields([{ name: 'paymentReceiptFiles', maxCount: 10 }]),
        ValidationMiddleware(UpdateVehiclePaymentDto, true), // true => partial validation
      ],
      this.paymentController.updateVehiclePayment,
    );

    // 👉 Get All Vehicle Payments
    this.router.get(
      `${this.path}/get-all`,
      [AuthMiddleware],
      this.paymentController.getAllVehiclePayments,
    );

     this.router.get(
      `${this.path}/get-vehicle-payments/:vehicle_id`,
      [AuthMiddleware],
      this.paymentController.getAllPaymentsByVehicleId,
    );

    // 👉 Get Vehicle Payment By ID
    this.router.get(
      `${this.path}/:id`,
      [AuthMiddleware],
      this.paymentController.getVehiclePaymentById,
    );

    // 👉 Delete Vehicle Payment
    this.router.delete(
      `${this.path}/delete-vehicle-payment/:id`,
      [AuthMiddleware],
      this.paymentController.deleteVehiclePayment,
    );
  }
}
