import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import multer from 'multer';
import { 
  createVehiclePaymentSchema, 
  updateVehiclePaymentSchema, 
  getAllPaymentsQuerySchema,
  exportPaymentsQuerySchema,
  paymentIdParamSchema,
  vehicleIdParamSchema
} from './payment.validator';
import { PaymentController } from './payment.controller';

export class PaymentRoute implements Routes {
  public path = '/payment';
  public router: Router = Router();
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
        ValidationMiddleware(createVehiclePaymentSchema, 'body'),
      ],
      this.paymentController.createVehiclePayment,
    );

    // 👉 Update Vehicle Payment
    this.router.put(
      `${this.path}/update-vehicle-payment/:id`,
      [
        AuthMiddleware,
        upload.fields([{ name: 'paymentReceiptFiles', maxCount: 10 }]),
        ValidationMiddleware(paymentIdParamSchema, 'params'),
        ValidationMiddleware(updateVehiclePaymentSchema, 'body'),
      ],
      this.paymentController.updateVehiclePayment,
    );

    // 👉 Get All Vehicle Payments
    this.router.get(
      `${this.path}/get-all`,
      [AuthMiddleware, ValidationMiddleware(getAllPaymentsQuerySchema, 'query')],
      this.paymentController.getAllVehiclePayments,
    );

    // 👉 Export Payments to CSV
    this.router.get(
      `${this.path}/export-payments`,
      [AuthMiddleware, ValidationMiddleware(exportPaymentsQuerySchema, 'query')],
      this.paymentController.exportPaymentsToCSV,
    );

     this.router.get(
      `${this.path}/get-vehicle-payments/:vehicle_id`,
      [AuthMiddleware, ValidationMiddleware(vehicleIdParamSchema, 'params')],
      this.paymentController.getAllPaymentsByVehicleId,
    );

    // 👉 Get Vehicle Payment By ID
    this.router.get(
      `${this.path}/:id`,
      [AuthMiddleware, ValidationMiddleware(paymentIdParamSchema, 'params')],
      this.paymentController.getVehiclePaymentById,
    );

    // 👉 Delete Vehicle Payment
    this.router.delete(
      `${this.path}/delete-vehicle-payment/:id`,
      [AuthMiddleware, ValidationMiddleware(paymentIdParamSchema, 'params')],
      this.paymentController.deleteVehiclePayment,
    );
  }
}
