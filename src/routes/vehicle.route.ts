import { Router } from 'express';
import { VehicleController } from '@/controllers/vehicle.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware, ValidateRequest } from '@middlewares/validation.middleware';
import {
  createVehicleSchema,
  updateVehicleSchema,
  VehicleIdParamSchema,
  getVehicleQuerySchema,
  exportVehicleQuerySchema,
} from '@/schemas/vehicle.schema';
import multer from 'multer';

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

    this.router.post(
      `${this.path}/create-vehicle`,
      [
        AuthMiddleware,
        upload.fields([
          { name: 'vehicleFiles', maxCount: 10 }, // For vehicle media
          { name: 'vehicleDocFiles', maxCount: 10 }, // For vehicle documents
        ]),
        ParseJsonFieldsMiddleware([
          'year',
          'mileage',
          'buying_price',
          'selling_price',
          'min_selling_price',
          'engine_capacity',
          'features',
          'vehicle_image_urls',
          'vehicle_doc_urls',
        ]),
        ValidationMiddleware(createVehicleSchema, 'body'),
      ],
      this.vehicleController.createVehicle,
    );

    // Update Vehicle
    this.router.put(
      `${this.path}/update-vehicle/:id`,
      [
        AuthMiddleware,
        upload.fields([
          { name: 'vehicleFiles', maxCount: 10 }, // For vehicle media
          { name: 'vehicleDocFiles', maxCount: 10 }, // For vehicle documents
        ]),
        ParseJsonFieldsMiddleware([
          'year',
          'mileage',
          'buying_price',
          'selling_price',
          'min_selling_price',
          'engine_capacity',
          'features',
          'vehicle_image_urls',
          'vehicle_doc_urls',
        ]),
        ValidateRequest({ body: updateVehicleSchema, params: VehicleIdParamSchema }),
      ],
      this.vehicleController.updateVehicle,
    );

    // Stream first vehicle image for share (must be before get-vehicle/:id so path matches correctly)
    this.router.get(
      `${this.path}/get-vehicle/:id/share-image`,
      [AuthMiddleware, ValidateRequest({ params: VehicleIdParamSchema })],
      this.vehicleController.getVehicleShareImage,
    );

    // Get Vehicle by ID
    this.router.get(
      `${this.path}/get-vehicle/:id`,
      [AuthMiddleware, ValidateRequest({ params: VehicleIdParamSchema })],
      this.vehicleController.getVehicleById,
    );

    this.router.get(
      `${this.path}/get-all-vehicle`,
      [AuthMiddleware, ValidateRequest({ query: getVehicleQuerySchema })],
      this.vehicleController.getAllVehicle,
    );

    // Get Vehicle Statistics
    this.router.get(`${this.path}/stats`, [AuthMiddleware], this.vehicleController.getVehicleStats);

    // Export Vehicles to CSV
    this.router.get(
      `${this.path}/export-vehicles`,
      [AuthMiddleware, ValidateRequest({ query: exportVehicleQuerySchema })],
      this.vehicleController.exportVehiclesToCSV,
    );

    // Delete Vehicle (Soft delete)
    this.router.delete(
      `${this.path}/delete-vehicle/:id`,
      [AuthMiddleware, ValidateRequest({ params: VehicleIdParamSchema })],
      this.vehicleController.deleteVehicle,
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
