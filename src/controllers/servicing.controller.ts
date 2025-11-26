import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { ServicingService } from '@/services/servicing.service';
import { IServicing } from '@/interfaces/servicing.interface';
import { GetServicingQueryDto, ExportServicingQueryDto } from '@/schemas/servicing.schema';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { stringify } from 'csv-stringify/sync';
import { logger } from '@utils/logger';
import { NotFoundException } from '@/exceptions/NotFoundException';

export class ServicingController {
  public servicingService = Container.get(ServicingService);

  // -----------------------------
  // CREATE SERVICING - Create new servicing record
  // -----------------------------
  public createServicing = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const servicingData: IServicing = request.body;
      const shop_id = request.user.shop_id;
      const newServicing = await this.servicingService.createServicing({...servicingData, shop_id: shop_id});
      response.status(201).json({ data: newServicing, message: 'Servicing created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET ALL SERVICINGS - Retrieve paginated servicing list
  // -----------------------------
  public getServicings = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
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
  public getServicingById = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
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
  public updateServicing = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
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
  // GET SERVICING STATISTICS - Get servicing stats for dashboard
  // -----------------------------
  public getServicingStats = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const stats = await this.servicingService.getServicingStats(shop_id);
      response.status(200).json({ data: stats, message: 'Successfully Retrieved Servicing Statistics' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // EXPORT SERVICINGS TO CSV - Export servicings data as CSV
  // -----------------------------
  public exportServicingsToCSV = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = request.query as unknown as ExportServicingQueryDto;
      const shop_id = request.user.shop_id;

      logger.info(`Export servicings CSV requested by shop ${shop_id} with filters: ${JSON.stringify(query)}`);

      const servicings = await this.servicingService.exportServicings(query, shop_id);

      if (servicings.length === 0) {
        logger.warn(`No servicings found for export with filters: ${JSON.stringify(query)}`);
        throw new NotFoundException('No servicings found to export');
      }

      // Define CSV columns
      const columns = [
        'Service Type',
        'Service Date',
        'Description',
        'Labor Cost',
        'Parts Cost',
        'Total Cost',
        'Status',
        'Next Service Date',
        'Created On',
      ];

      // Helper function to format date as DD/MM/YYYY
      const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Convert servicings to CSV rows
      const rows = servicings.map((servicing: any) => [
        servicing.service_type || '',
        formatDate(servicing.service_date),
        servicing.description || '',
        servicing.labor_cost?.toString() || '0',
        servicing.parts_cost?.toString() || '0',
        servicing.total_cost?.toString() || '0',
        servicing.status || '',
        formatDate(servicing.next_service_date),
        formatDate(servicing.created_at),
      ]);

      // Generate CSV string
      const csv = stringify(rows, {
        header: true,
        columns: columns,
        quoted: true,
      });

      logger.info(`Successfully exported ${servicings.length} servicings to CSV`);

      // Set response headers for CSV download
      const filename = `servicings_${new Date().toISOString().split('T')[0]}.csv`;
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.status(200).send(csv);
    } catch (error) {
      logger.error(`Export servicings CSV error: ${error.message}`);
      next(error);
    }
  };

  // -----------------------------
  // DELETE SERVICING - Soft delete servicing record
  // -----------------------------
  public deleteServicing = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params;
      const deletedServicing = await this.servicingService.deleteServicing(id);
      response.status(200).json({ data: deletedServicing, message: 'Servicing deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
