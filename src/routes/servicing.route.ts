import { Router } from 'express';
import { ServicingController } from '@/controllers/servicing.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { CreateServicingDto, UpdateServicingDto } from '@dtos/servicing.dto';

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
      AuthMiddleware,
      ValidationMiddleware(CreateServicingDto),
      this.servicingController.createServicing,
    );

    // Update
    this.router.put(
      `${this.path}/update/:id`,
      AuthMiddleware,
      ValidationMiddleware(UpdateServicingDto, true),
      this.servicingController.updateServicing,
    );

    // Get all
    this.router.get(
      `${this.path}/get-all`,
      AuthMiddleware,
      this.servicingController.getServicings,
    );

    // Get by id
    this.router.get(
      `${this.path}/:id`,
      AuthMiddleware,
      this.servicingController.getServicingById,
    );

    // Delete
    this.router.delete(
      `${this.path}/delete/:id`,
      AuthMiddleware,
      this.servicingController.deleteServicing,
    );
  }
}
