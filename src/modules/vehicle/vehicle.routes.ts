import { Router, type RequestHandler } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ValidationMiddleware, ValidateRequest } from '@/middlewares/validation.middleware';
import {
  createVehicleSchema,
  updateVehicleSchema,
  VehicleIdParamSchema,
  getVehicleQuerySchema,
  exportVehicleQuerySchema,
} from './vehicle.validator';
import { VehicleController } from './vehicle.controller';
import { VEHICLE_DOCUMENT_FIELD_NAMES } from './vehicle.documents';
import multer, { type Field } from 'multer';

const auth = AuthMiddleware as RequestHandler;

const vehicleMultipartFields: Field[] = [
  { name: 'vehicleFiles', maxCount: 5 },
  ...VEHICLE_DOCUMENT_FIELD_NAMES.map(name => ({ name: name as string, maxCount: 1 })),
];

export class VehicleRoute implements Routes {
  public path = '/vehicle';
  public router: Router = Router();
  public vehicleController = new VehicleController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
      },
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

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    });

    // Multipart body also accepts string fields (not listed below) e.g. seller_customer_id, buyer_customer_id.
    this.router.post(
      `${this.path}/create-vehicle`,
      [
        auth,
        upload.fields(vehicleMultipartFields),
        ParseJsonFieldsMiddleware([
          'manufacture_year',
          'registration_year',
          'odometer_reading',
          'buying_price',
          'selling_price',
          'min_selling_price',
          'estimated_rto_charges',
          'vehicle_image_urls',
          'vehicle_documents',
          'two_wheeler_detail',
          'four_wheeler_detail',
        ]),
        ValidationMiddleware(createVehicleSchema, 'body'),
      ],
      this.vehicleController.createVehicle as RequestHandler,
    );

    // Multipart body also accepts seller_customer_id, buyer_customer_id as plain form fields.
    // Update Vehicle
    this.router.put(
      `${this.path}/update-vehicle/:id`,
      [
        auth,
        upload.fields(vehicleMultipartFields),
        ParseJsonFieldsMiddleware([
          'year',
          'mileage',
          'buying_price',
          'selling_price',
          'min_selling_price',
          'engine_capacity',
          'vehicle_image_urls',
          'vehicle_documents',
        ]),
        ValidateRequest({ body: updateVehicleSchema, params: VehicleIdParamSchema }),
      ],
      this.vehicleController.updateVehicle as RequestHandler,
    );

    // Stream first vehicle image for share (must be before get-vehicle/:id so path matches correctly)
    this.router.get(
      `${this.path}/get-vehicle/:id/share-image`,
      [auth, ValidateRequest({ params: VehicleIdParamSchema })],
      this.vehicleController.getVehicleShareImage as RequestHandler,
    );

    // Get Vehicle by ID
    this.router.get(
      `${this.path}/get-vehicle/:id`,
      [auth, ValidateRequest({ params: VehicleIdParamSchema })],
      this.vehicleController.getVehicleById as RequestHandler,
    );

    this.router.get(
      `${this.path}/get-all-vehicle`,
      [auth, ValidateRequest({ query: getVehicleQuerySchema })],
      this.vehicleController.getAllVehicle as RequestHandler,
    );

    // Get Vehicle Statistics
    this.router.get(`${this.path}/stats`, [auth], this.vehicleController.getVehicleStats as RequestHandler);

    // Export Vehicles to CSV
    this.router.get(
      `${this.path}/export-vehicles`,
      [auth, ValidateRequest({ query: exportVehicleQuerySchema })],
      this.vehicleController.exportVehiclesToCSV as RequestHandler,
    );

    // Delete Vehicle (Soft delete)
    this.router.delete(
      `${this.path}/delete-vehicle/:id`,
      [auth, ValidateRequest({ params: VehicleIdParamSchema })],
      this.vehicleController.deleteVehicle as RequestHandler,
    );

    // Extract Vehicle Details from RC
    const rcUpload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max
      },
      fileFilter: (_req, file, cb) => {
        const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, HEIC, PDF`) as any);
        }
      },
    });

    // Accept 2-side RC uploads: rc_front + rc_back (keeps rc_image for backward compatibility)
    this.router.post(
      `${this.path}/extract-rc`,
      [
        auth,
        rcUpload.fields([
          { name: 'rc_front', maxCount: 1 },
          { name: 'rc_back', maxCount: 1 },
          { name: 'rc_image', maxCount: 1 },
        ]),
      ],
      this.vehicleController.extractRC as RequestHandler,
    );
  }
}

function ParseJsonFieldsMiddleware(fields: string[]) {
  return (req, res, next) => {
    try {
      fields.forEach(field => {
        const value = req.body[field];

        if (!value) return;

        if (typeof value === 'object') {
          return;
        }

        if (typeof value === 'string') {
          try {
            // First parse
            let parsed = JSON.parse(value);

            // Handle double-encoded JSON (safety check for nested JSON.stringify)
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }

            req.body[field] = parsed;
          } catch (e) {
            return res.status(400).json({
              message: `Invalid JSON in field: ${field}`,
              error: e.message,
            });
          }
        }
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}
