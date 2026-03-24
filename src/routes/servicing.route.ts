import { Router } from 'express';
import { ServicingController } from '@/controllers/servicing.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidateRequest } from '@middlewares/validation.middleware';
import { createServicingSchema, updateServicingSchema, servicingIdParamSchema, getServicingQuerySchema, exportServicingQuerySchema } from '@/validator/servicing.validator';

export class ServicingRoute implements Routes {
  public path = '/servicing';
  public router: Router = Router();
  public servicingController = new ServicingController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create
    this.router.post(
      `${this.path}/create`,
      [AuthMiddleware, ValidateRequest({ body: createServicingSchema })],
      this.servicingController.createServicing,
    );

    // Update
    this.router.put(
      `${this.path}/update/:id`,
      [AuthMiddleware, ValidateRequest({ body: updateServicingSchema, params: servicingIdParamSchema })],
      this.servicingController.updateServicing,
    );

    // Get all
    this.router.get(
      `${this.path}/get-all`,
      [AuthMiddleware, ValidateRequest({ query: getServicingQuerySchema })],
      this.servicingController.getServicings,
    );

    // Get Servicing Statistics
    this.router.get(
      `${this.path}/stats`,
      [AuthMiddleware],
      this.servicingController.getServicingStats,
    );

    // Export Servicings to CSV
    this.router.get(
      `${this.path}/export-servicings`,
      [AuthMiddleware, ValidateRequest({ query: exportServicingQuerySchema })],
      this.servicingController.exportServicingsToCSV,
    );

    // Get by id
    this.router.get(
      `${this.path}/:id`,
      [AuthMiddleware, ValidateRequest({ params: servicingIdParamSchema })],
      this.servicingController.getServicingById,
    );

    // Delete
    this.router.delete(
      `${this.path}/delete/:id`,
      [AuthMiddleware, ValidateRequest({ params: servicingIdParamSchema })],
      this.servicingController.deleteServicing,
    );
  }
}
