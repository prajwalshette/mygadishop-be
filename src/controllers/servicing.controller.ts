import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { ServicingService } from '@/services/servicing.service';
import { IServicing } from '@/interfaces/servicing.interface';
import { GetServicingQueryDto } from '@/schemas/servicing.schema';

export class ServicingController {
  public servicingService = Container.get(ServicingService);

  // -----------------------------
  // CREATE SERVICING - Create new servicing record
  // -----------------------------
  public createServicing = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const servicingData: IServicing = request.body;
      const newServicing = await this.servicingService.createServicing(servicingData);
      response.status(201).json({ data: newServicing, message: 'Servicing created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET ALL SERVICINGS - Retrieve paginated servicing list
  // -----------------------------
  public getServicings = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Query is validated by ValidateRequest middleware
      const query = request.query as unknown as GetServicingQueryDto;

      const result = await this.servicingService.getServicings(query);
      response.status(200).json({ data: result, message: 'Servicings fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET SERVICING BY ID - Retrieve single servicing record
  // -----------------------------
  public getServicingById = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const servicing = await this.servicingService.getServicingById(id);
      response.status(200).json({ data: servicing, message: 'Servicing fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UPDATE SERVICING - Modify existing servicing record
  // -----------------------------
  public updateServicing = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const servicingData: Partial<IServicing> = request.body;
      const updatedServicing = await this.servicingService.updateServicing(id, servicingData);
      response.status(200).json({ data: updatedServicing, message: 'Servicing updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // DELETE SERVICING - Soft delete servicing record
  // -----------------------------
  public deleteServicing = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const deletedServicing = await this.servicingService.deleteServicing(id);
      response.status(200).json({ data: deletedServicing, message: 'Servicing deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
