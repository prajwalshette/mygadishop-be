import { Router } from 'express';
import { ServicingController } from '@/controllers/servicing.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidateRequest } from '@middlewares/validation.middleware';
import { createServicingSchema, updateServicingSchema, servicingIdParamSchema, getServicingQuerySchema } from '@/schemas/servicing.schema';

export class ServicingRoute implements Routes {
  public path = '/servicing';
  public router = Router();
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
