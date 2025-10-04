import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { ServicingService } from '@/services/servicing.service';
import { IServicing } from '@/interfaces/servicing.interface';

export class ServicingController {
  public servicingService = Container.get(ServicingService);

  // Create
  public createServicing = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const servicingData: IServicing = request.body;
      const newServicing = await this.servicingService.createServicing(servicingData);
      response.status(201).json({ data: newServicing, message: 'Servicing created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Get all
  public getServicings = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { page_number, page_size } = request.query;

      const pageNumber = page_number ? Number(page_number) : 1;
      const pageSize = page_size ? Number(page_size) : 10;

      const servicings = await this.servicingService.getServicings(pageNumber, pageSize);
      response.status(200).json({ data: {...servicings}, message: 'Servicings fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Get by ID
  public getServicingById = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const servicing = await this.servicingService.getServicingById(id);
      response.status(200).json({ data: servicing, message: 'Servicing fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Update
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

  // Delete
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
