import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { VehicleService } from '@/services/vehicle.service';
import { IVehicle } from '@/interfaces/vehicle.interface';
import { ulid } from 'ulid';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { HttpException } from '@/exceptions/HttpException';
import { uploadVehicleMedia, uploadVehicleDocMedia } from '@/services/aws.service';

export class VehicleController {
  public vehicleService = Container.get(VehicleService);

  public createVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleData: IVehicle = request.body;
      const vehicle_id = ulid();

      let vehicle_image_urls: string[] = [];
      let vehicle_doc_urls: string[] = [];

      // Cast request.files to the expected type
      const files = request.files as { [fieldname: string]: Express.Multer.File[] };

      // Upload vehicle media files if present
      if (files && files.vehicleFiles && files.vehicleFiles.length > 0) {
        vehicle_image_urls = await this.handleVehicleMediaUpload(request, response, vehicle_id);
      }

      // Upload vehicle document files if present
      if (files && files.vehicleDocFiles && files.vehicleDocFiles.length > 0) {
        vehicle_doc_urls = await this.handleVehicleDocMediaUpload(request, response, vehicle_id);
      }

      const vehicleDataWithMedia: IVehicle = {
        ...vehicleData,
        id: vehicle_id,
        vehicle_doc_urls: vehicle_doc_urls,
        vehicle_image_urls: vehicle_image_urls,
      };

      const vehicle = await this.vehicleService.createVehicle(vehicleDataWithMedia);
      response.status(201).json({ data: vehicle, message: 'Successfully Add New Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  public updateVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId: string = request.params.id;
      const vehicleData: Partial<IVehicle> = request.body;

      // Check if vehicle exists
      const existingVehicle = await this.vehicleService.getVehicleById(vehicleId);
      if (!existingVehicle) {
        throw new HttpException(404, `Vehicle not found with id: ${vehicleId}`);
      }

      // Handle file uploads
      let vehicle_image_urls: string[] = [...(existingVehicle.vehicle_image_urls || [])];
      let vehicle_doc_urls: string[] = [...(existingVehicle.vehicle_doc_urls || [])];

      // Upload new vehicle media files if present
      if (request.vehicleFiles && request.vehicleFiles.vehicleFiles) {
        const newImageUrls = await this.handleVehicleMediaUpload(request, response, vehicleId);

        // You can choose to append or replace existing images
        if (request.body.replaceImages === 'true') {
          vehicle_image_urls = newImageUrls;
        } else {
          vehicle_image_urls = [...vehicle_image_urls, ...newImageUrls];
        }
      }

      // Upload new vehicle document files if present
      if (request.vehicleDocFiles && request.vehicleDocFiles.vehicleDocFiles) {
        const newDocUrls = await this.handleVehicleDocMediaUpload(request, response, vehicleId);

        // You can choose to append or replace existing documents
        if (request.body.replaceDocuments === 'true') {
          vehicle_doc_urls = newDocUrls;
        } else {
          vehicle_doc_urls = [...vehicle_doc_urls, ...newDocUrls];
        }
      }

      const vehicleDataWithMedia: Partial<IVehicle> = {
        ...vehicleData,
        vehicle_doc_urls: vehicle_doc_urls,
        vehicle_image_urls: vehicle_image_urls,
      };

      const updatedVehicle = await this.vehicleService.updateVehicle(vehicleId, vehicleDataWithMedia);
      response.status(200).json({ data: updatedVehicle, message: 'Successfully Updated Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  public getVehicleById = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId: string = request.params.id;
      const vehicle = await this.vehicleService.getVehicleById(vehicleId);

      if (!vehicle) {
        throw new HttpException(404, `Vehicle not found with id: ${vehicleId}`);
      }

      response.status(200).json({ data: vehicle, message: 'Successfully Retrieved Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  public getAllVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { page_number, page_size } = request.query;

      const pageNumber = page_number ? Number(page_number) : 1;
      const pageSize = page_size ? Number(page_size) : 5;
      const vehicles = await this.vehicleService.getAllVehicle(pageNumber, pageSize);

      response.status(200).json({ data: { ...vehicles }, message: 'Successfully Retrieved Vehicles' });
    } catch (error) {
      next(error);
    }
  };

  public deleteVehicle = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId: string = request.params.id;
      await this.vehicleService.deleteVehicle(vehicleId);

      response.status(200).json({ message: 'Successfully Deleted Vehicle' });
    } catch (error) {
      next(error);
    }
  };

  private async handleVehicleMediaUpload(request: RequestWithUser, response: Response, vehicle_id: string): Promise<string[]> {
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

      const uploadResult = await uploadVehicleMedia(tempRequest, response, 'file', vehicle_id);
      vehicleFilesUrls.push(uploadResult.fileUrl);
    }

    return vehicleFilesUrls;
  } catch (uploadError) {
    throw new HttpException(500, `Failed to upload Vehicle media: ${uploadError.message}`);
  }
}

private async handleVehicleDocMediaUpload(request: RequestWithUser, response: Response, vehicle_id: string): Promise<string[]> {
  try {
    // Access files from request.files, not request.vehicleDocFiles
    const files = (request.files as { [fieldname: string]: Express.Multer.File[] }).vehicleDocFiles as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return [];
    }

    const vehicleDocFilesUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Create a temporary request object for each file
      const tempRequest = {
        ...request,
        file: file,
      } as RequestWithUser;

      const uploadResult = await uploadVehicleDocMedia(tempRequest, response, 'file', vehicle_id);
      vehicleDocFilesUrls.push(uploadResult.fileUrl);
    }

    return vehicleDocFilesUrls;
  } catch (uploadError) {
    throw new HttpException(500, `Failed to upload Vehicle Doc: ${uploadError.message}`);
  }
}
}
