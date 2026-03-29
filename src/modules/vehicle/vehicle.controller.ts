import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import type { IVehicle } from './vehicle.interface';
import type { CreateVehicleDto, ExportVehicleQueryDto, GetVehicleQueryDto, UpdateVehicleDto } from './vehicle.validator';
import { VEHICLE_DOCUMENT_FIELD_NAMES } from './vehicle.documents';
import { DocumentType } from '@prisma/client';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import { VehicleService } from './vehicle.service';
import { ulid } from 'ulid';
import { BadRequestException, NotFoundException } from '@/exceptions';
import { uploadVehicleDocMedia, uploadVehicleMedia } from '@/services/aws/aws.service';
import { stringify } from 'csv-stringify/sync';
import { logger } from '@/utils/logger';

export class VehicleController {
  public vehicleService = Container.get(VehicleService);

  // -----------------------------
  // CREATE VEHICLE - Handle vehicle creation with file uploads
  // -----------------------------
  public createVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleData: IVehicle = request.body;
      const vehicle_id = ulid();
      const shop_id = request.user.shop_id;

      let vehicle_image_urls: string[] = [];

      const files = request.files as { [fieldname: string]: Express.Multer.File[] };

      if (files && files.vehicleFiles && files.vehicleFiles.length > 0) {
        vehicle_image_urls = await this.handleVehicleMediaUpload(request, response, shop_id, vehicle_id);
      }

      const documentUploads = await this.collectTypedDocumentUploads(request, response, shop_id, vehicle_id);
      const documentRows = this.mergeVehicleDocumentsForCreate(
        (vehicleData as unknown as CreateVehicleDto).vehicle_documents,
        documentUploads,
      );

      const { vehicle_documents: _omitDocs, ...vehicleRest } = vehicleData as IVehicle & { vehicle_documents?: CreateVehicleDto['vehicle_documents'] };

      const vehicleDataWithMedia: IVehicle = {
        ...vehicleRest,
        id: vehicle_id,
        vehicle_image_urls: vehicle_image_urls,
      };

      const vehicle = await this.vehicleService.createVehicle(vehicleDataWithMedia, shop_id, documentRows);
      response.status(201).json({ data: vehicle, message: 'Successfully Add New Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UPDATE VEHICLE - Handle vehicle updates with file uploads
  // -----------------------------
  public updateVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId: string = request.params.id as string;
      const vehicleData: Partial<IVehicle> = request.body;
      const shop_id = request.user.shop_id;

      const existingRow = await this.vehicleService.getVehicleWithDocumentsRaw(vehicleId);
      if (!existingRow) {
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      let vehicle_image_urls: string[] = Array.isArray(vehicleData.vehicle_image_urls)
        ? vehicleData.vehicle_image_urls
        : [...(existingRow.vehicle_image_urls || [])];

      const files = request.files as { [fieldname: string]: Express.Multer.File[] };

      if (files && files.vehicleFiles && files.vehicleFiles.length > 0) {
        const newImageUrls = await this.handleVehicleMediaUpload(request, response, shop_id, vehicleId);
        vehicle_image_urls = [...vehicle_image_urls, ...newImageUrls];
      }

      const documentUploads = await this.collectTypedDocumentUploads(request, response, shop_id, vehicleId);
      const hasUploadedDocs = documentUploads.length > 0;
      const bodyDocs = (vehicleData as { vehicle_documents?: UpdateVehicleDto['vehicle_documents'] }).vehicle_documents;
      const hasBodyDocs = !!(bodyDocs && bodyDocs.length > 0);
      const documentRows =
        hasUploadedDocs || hasBodyDocs
          ? this.mergeVehicleDocumentsForUpdate(existingRow.vehicleDocuments, bodyDocs, documentUploads)
          : undefined;

      const { vehicle_documents: _omitDocs, ...vehicleRest } = vehicleData as Partial<IVehicle> & {
        vehicle_documents?: UpdateVehicleDto['vehicle_documents'];
      };

      const vehicleDataWithMedia: Partial<IVehicle> = {
        ...vehicleRest,
        vehicle_image_urls: vehicle_image_urls,
      };

      const updatedVehicle = await this.vehicleService.updateVehicle(vehicleId, vehicleDataWithMedia, documentRows);
      response.status(200).json({ data: updatedVehicle, message: 'Successfully Updated Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET VEHICLE BY ID - Retrieve single vehicle details
  // -----------------------------
  public getVehicleById = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId = request.params.id as string;
      const vehicle = await this.vehicleService.getVehicleById(vehicleId);

      if (!vehicle) {
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      response.status(200).json({ data: vehicle, message: 'Successfully Retrieved Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Stream first vehicle image for share (proxied from S3 so frontend can fetch without CORS and attach to WhatsApp share).
   */
  public getVehicleShareImage = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId: string = request.params.id as string;
      const shop_id = request.user.shop_id;
      const result = await this.vehicleService.getVehicleShareImageStream(vehicleId, shop_id);

      if (!result) {
        throw new NotFoundException(`Vehicle image not found for id: ${vehicleId}`);
      }

      response.setHeader('Content-Type', result.contentType);
      result.stream.pipe(response);
      result.stream.on('error', err => {
        logger.error(err, 'Vehicle share image stream error');
        if (!response.headersSent) {
          response.status(500).end();
        } else {
          response.destroy();
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET ALL VEHICLES - Retrieve paginated vehicle list
  // -----------------------------
  public getAllVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Query is validated by ValidateRequest middleware
      const query = request.query as unknown as GetVehicleQueryDto;
      const shop_id = request.user.shop_id;

      const result = await this.vehicleService.getAllVehicle(query, shop_id);

      response.status(200).json({ data: result, message: 'Successfully Retrieved Vehicles' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET VEHICLE STATISTICS - Get vehicle stats for dashboard
  // -----------------------------
  public getVehicleStats = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.user.shop_id;
      const stats = await this.vehicleService.getVehicleStats(shop_id);
      response.status(200).json({ data: stats, message: 'Successfully Retrieved Vehicle Statistics' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // EXPORT VEHICLES TO CSV - Export vehicles data as CSV
  // -----------------------------
  public exportVehiclesToCSV = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = request.query as unknown as ExportVehicleQueryDto;
      const shop_id = request.user.shop_id;

      logger.info(`Export vehicles CSV requested by shop ${shop_id} with filters: ${JSON.stringify(query)}`);

      const vehicles = await this.vehicleService.exportVehicles(query, shop_id);

      if (vehicles.length === 0) {
        logger.warn(`No vehicles found for export with filters: ${JSON.stringify(query)}`);
        throw new NotFoundException('No vehicles found to export');
      }

      // Define CSV columns
      const columns = [
        'Type',
        'Brand',
        'Model',
        'Variant',
        'Year',
        'Registration Number',
        'Chassis Number',
        'Engine Number',
        'Color',
        'Mileage',
        'Fuel Type',
        'Transmission',
        'Engine Capacity',
        'Ownership',
        'Insurance Valid Till',
        'Buying Price',
        'Selling Price',
        'Status',
        'Buying Date',
        'Selling Date',
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

      // Convert vehicles to CSV rows
      const rows = vehicles.map((vehicle: any) => [
        vehicle.type || '',
        vehicle.brand || '',
        vehicle.model || '',
        vehicle.variant || '',
        vehicle.year?.toString() || '',
        vehicle.registration_number || '',
        vehicle.chassis_number || '',
        vehicle.engine_number || '',
        vehicle.color || '',
        vehicle.mileage?.toString() || '',
        vehicle.fuel_type || '',
        vehicle.transmission || '',
        vehicle.engine_capacity?.toString() || '',
        vehicle.ownership || '',
        formatDate(vehicle.insurance_valid_till),
        vehicle.buying_price?.toString() || '',
        vehicle.selling_price?.toString() || '',
        vehicle.status || '',
        formatDate(vehicle.buying_date),
        formatDate(vehicle.selling_date),
        formatDate(vehicle.created_at),
      ]);

      // Generate CSV string
      const csv = stringify(rows, {
        header: true,
        columns: columns,
        quoted: true,
      });

      logger.info(`Successfully exported ${vehicles.length} vehicles to CSV`);

      // Set response headers for CSV download
      const filename = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
      response.setHeader('Content-Type', 'text/csv');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.status(200).send(csv);
    } catch (error) {
      logger.error(`Export vehicles CSV error: ${error.message}`);
      next(error);
    }
  };

  // -----------------------------
  // DELETE VEHICLE - Soft delete vehicle
  // -----------------------------
  public deleteVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId: string = request.params.id as string;
      await this.vehicleService.deleteVehicle(vehicleId);

      response.status(200).json({ message: 'Successfully Deleted Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // HELPER: Handle vehicle media upload
  // -----------------------------
  private async handleVehicleMediaUpload(request: RequestWithUser, response: Response, shop_id: string, vehicle_id: string): Promise<string[]> {
    try {
      // Access files from request.files, not request.vehicleFiles
      const files = (request.files as { [fieldname: string]: Express.Multer.File[] }).vehicleFiles as Express.Multer.File[];

      if (!files || files.length === 0) {
        return [];
      }

      const vehicleFilesUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Create a temporary request object for each file
        const tempRequest = {
          ...request,
          file: file,
        } as RequestWithUser;

        const uploadResult = await uploadVehicleMedia(tempRequest, response, 'file', shop_id, vehicle_id);
        vehicleFilesUrls.push(uploadResult.fileUrl);
      }

      return vehicleFilesUrls;
    } catch (uploadError) {
      throw new BadRequestException(`Failed to upload Vehicle media: ${uploadError.message}`);
    }
  }

  private async collectTypedDocumentUploads(
    request: RequestWithUser,
    response: Response,
    shop_id: string,
    vehicle_id: string,
  ): Promise<{ doc_type: DocumentType; file_url: string }[]> {
    const files = request.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (!files) return [];

    const out: { doc_type: DocumentType; file_url: string }[] = [];

    for (const docType of VEHICLE_DOCUMENT_FIELD_NAMES) {
      const arr = files[docType] as Express.Multer.File[] | undefined;
      if (!arr?.[0]) continue;

      const tempRequest = { ...request, file: arr[0] } as RequestWithUser;
      const uploadResult = await uploadVehicleDocMedia(tempRequest, response, 'file', shop_id, vehicle_id, docType);
      out.push({ doc_type: docType, file_url: uploadResult.fileUrl });
    }

    return out;
  }

  private mergeVehicleDocumentsForCreate(
    bodyDocs: CreateVehicleDto['vehicle_documents'] | undefined,
    uploads: { doc_type: DocumentType; file_url: string }[],
  ): { doc_type: DocumentType; file_url: string; expiry_date?: Date | null; notes?: string | null }[] {
    const map = new Map<DocumentType, { file_url?: string; expiry_date?: Date | null; notes?: string | null }>();

    for (const d of bodyDocs ?? []) {
      map.set(d.doc_type, {
        file_url: d.file_url,
        expiry_date: d.expiry_date ?? undefined,
        notes: d.notes ?? undefined,
      });
    }
    for (const u of uploads) {
      const prev = map.get(u.doc_type);
      map.set(u.doc_type, { ...prev, file_url: u.file_url });
    }

    return Array.from(map.entries())
      .filter(([, v]) => !!v.file_url)
      .map(([doc_type, v]) => ({
        doc_type,
        file_url: v.file_url!,
        expiry_date: v.expiry_date,
        notes: v.notes,
      }));
  }

  private mergeVehicleDocumentsForUpdate(
    existing: { doc_type: DocumentType; file_url: string | null; expiry_date: Date | null; notes: string | null }[],
    bodyDocs: UpdateVehicleDto['vehicle_documents'] | undefined,
    uploads: { doc_type: DocumentType; file_url: string }[],
  ): { doc_type: DocumentType; file_url: string; expiry_date?: Date | null; notes?: string | null }[] {
    const map = new Map<DocumentType, { file_url?: string; expiry_date?: Date | null; notes?: string | null }>();

    for (const d of existing) {
      if (d.file_url) {
        map.set(d.doc_type, {
          file_url: d.file_url,
          expiry_date: d.expiry_date ?? undefined,
          notes: d.notes ?? undefined,
        });
      }
    }
    for (const d of bodyDocs ?? []) {
      const prev = map.get(d.doc_type) ?? {};
      map.set(d.doc_type, {
        ...prev,
        file_url: d.file_url !== undefined ? d.file_url : prev.file_url,
        expiry_date: d.expiry_date !== undefined ? d.expiry_date : prev.expiry_date,
        notes: d.notes !== undefined ? d.notes : prev.notes,
      });
    }
    for (const u of uploads) {
      const prev = map.get(u.doc_type) ?? {};
      map.set(u.doc_type, { ...prev, file_url: u.file_url });
    }

    return Array.from(map.entries())
      .filter(([, v]) => !!v.file_url)
      .map(([doc_type, v]) => ({
        doc_type,
        file_url: v.file_url!,
        expiry_date: v.expiry_date,
        notes: v.notes,
      }));
  }
}
