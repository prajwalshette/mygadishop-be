import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';
import { FuelType, IVehicle, VehicleType, TransmissionType, BikeStatus, OwnershipType } from '@/interfaces/vehicle.interface';
import { generateVehiclePresignedUrls } from './aws.service';
import { getCachedVehiclePresignedUrls } from '@/utils/cacheVehiclePresignedUrl';

@Service()
export class VehicleService {
  private prisma = prisma;

  public async createVehicle(vehicleData: IVehicle, shop_id: string): Promise<IVehicle> {
    try {
      const isExistVehicle = await this.prisma.vehicle.findFirst({
        where: { registration_number: vehicleData.registration_number, chassis_number: vehicleData.chassis_number, is_deleted: false, shop_id: shop_id },
      });

      if (isExistVehicle) {
        throw new HttpException(
          404,
          `Vehicle alredy exist registration_number: ${vehicleData.registration_number}, chassis_number: ${vehicleData.chassis_number}`,
        );
      }
      const vehicle = await this.prisma.vehicle.create({
        data: {
          id: ulid(),
          shop_id: shop_id,
          ...vehicleData,
          selling_date: vehicleData.selling_date ? new Date(vehicleData.selling_date) : null,
          buying_date: vehicleData.buying_date ? new Date(vehicleData.buying_date) : null,
          insurance_valid_till: new Date(vehicleData.insurance_valid_till),
        }as Prisma.VehicleUncheckedCreateInput,
      });
      return {
        ...vehicle,
        type: vehicle.type as VehicleType,
        fuel_type: vehicle.fuel_type as FuelType,
        transmission: vehicle.transmission as TransmissionType,
        status: vehicle.status as BikeStatus,
        ownership: vehicleData.ownership as OwnershipType,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error create vehicle: ${error.message}`);
    }
  }

  public async updateVehicle(vehicleId: string, vehicleData: Partial<IVehicle>): Promise<IVehicle> {
    try {
      // Check if vehicle exists and is not deleted
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          is_deleted: false,
        },
      });

      if (!existingVehicle) {
        throw new HttpException(404, `Vehicle not found with id: ${vehicleId}`);
      }

      // Check if registration_number or chassis_number is being updated and already exists
      if (vehicleData.registration_number || vehicleData.chassis_number) {
        const duplicateVehicle = await this.prisma.vehicle.findFirst({
          where: {
            OR: [
              ...(vehicleData.registration_number ? [{ registration_number: vehicleData.registration_number }] : []),
              ...(vehicleData.chassis_number ? [{ chassis_number: vehicleData.chassis_number }] : []),
            ],
            AND: [
              { id: { not: vehicleId } }, // Exclude current vehicle
              { is_deleted: false },
            ],
          },
        });

        if (duplicateVehicle) {
          throw new HttpException(409, `Vehicle already exists with the same registration_number or chassis_number`);
        }
      }

      // Remove id from update data if present (shouldn't be updated)
      const { id, ...updateData } = vehicleData;

      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...updateData,
          updated_at: new Date(),
          selling_date: vehicleData.selling_date ? new Date(vehicleData.selling_date) : existingVehicle.selling_date,
          buying_date: vehicleData.buying_date ? new Date(vehicleData.buying_date) : existingVehicle.buying_date,
        }as Prisma.VehicleUncheckedCreateInput,
      });

      return {
        ...updatedVehicle,
        type: updatedVehicle.type as VehicleType,
        fuel_type: updatedVehicle.fuel_type as FuelType,
        transmission: updatedVehicle.transmission as TransmissionType,
        status: updatedVehicle.status as BikeStatus,
        ownership: updatedVehicle.ownership as OwnershipType,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error updating vehicle: ${error.message}`);
    }
  }

  public async getVehicleById(vehicleId: string): Promise<IVehicle | null> {
    try {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          is_deleted: false,
        },
      });

      if (!vehicle) {
        return null;
      }

      try {
        let presignedUrls = await getCachedVehiclePresignedUrls(vehicleId);
        if (!presignedUrls) {
          console.log(`Cache miss for vehicle ${vehicleId}, generating new presigned URLs`);
          presignedUrls = await generateVehiclePresignedUrls(
            vehicleId,
            vehicle.vehicle_image_urls || [],
            vehicle.vehicle_doc_urls || [],
            3600 // 1 hour expiration
          );
        }

        return {
          ...vehicle,
          type: vehicle.type as VehicleType,
          fuel_type: vehicle.fuel_type as FuelType,
          transmission: vehicle.transmission as TransmissionType,
          status: vehicle.status as BikeStatus,
          vehicle_image_urls: presignedUrls?.imageUrls || vehicle.vehicle_image_urls || [],
          vehicle_doc_urls: presignedUrls?.docUrls || vehicle.vehicle_doc_urls || [],
          ownership: vehicle.ownership as OwnershipType,
        };
      } catch (urlError) {
        console.error(`Error processing URLs for vehicle ${vehicleId}:`, urlError);
        return {
          ...vehicle,
          type: vehicle.type as VehicleType,
          fuel_type: vehicle.fuel_type as FuelType,
          transmission: vehicle.transmission as TransmissionType,
          status: vehicle.status as BikeStatus,
          ownership: vehicle.ownership as OwnershipType,
          // Fallback to original URLs
          vehicle_image_urls: vehicle.vehicle_image_urls || [],
          vehicle_doc_urls: vehicle.vehicle_doc_urls || [],
        };
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching vehicle: ${error.message}`);
    }
  }

  public async getAllVehicle(pageNumber: number, pageSize: number): Promise<any> {
    try {
      const skip = (pageNumber - 1) * pageSize;
      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          is_deleted: false,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      });

      const vehiclesCount = await this.prisma.vehicle.count({
        where: {
          is_deleted: false,
        },
      });

      // Process vehicles to add presigned URLs
      const vehiclesWithPresignedUrls = await Promise.all(
        vehicles.map(async vehicle => {
          try {
            let presignedUrls = await getCachedVehiclePresignedUrls(vehicle.id);

            // If not cached, generate new presigned URLs
            if (!presignedUrls) {
              console.log(`Cache miss for vehicle ${vehicle.id}, generating new presigned URLs`);
              presignedUrls = await generateVehiclePresignedUrls(
                vehicle.id,
                vehicle.vehicle_image_urls || [],
                vehicle.vehicle_doc_urls || [],
                3600 // 1 hour expiration
              );
            }

            // Return vehicle with presigned URLs
            return {
              ...vehicle,
              type: vehicle.type as VehicleType,
              fuel_type: vehicle.fuel_type as FuelType,
              transmission: vehicle.transmission as TransmissionType,
              status: vehicle.status as BikeStatus,
              vehicle_image_urls: presignedUrls?.imageUrls || [],
              vehicle_doc_urls: presignedUrls?.docUrls || [],
            };
          } catch (urlError) {
            console.error(`Error processing URLs for vehicle ${vehicle.id}:`, urlError);
            // Return vehicle with original URLs if presigned URL generation fails
            return {
              ...vehicle,
              type: vehicle.type as VehicleType,
              fuel_type: vehicle.fuel_type as FuelType,
              transmission: vehicle.transmission as TransmissionType,
              status: vehicle.status as BikeStatus,
              // Fallback to original URLs
              vehicle_image_urls: vehicle.vehicle_image_urls || [],
              vehicle_doc_urls: vehicle.vehicle_doc_urls || [],
            };
          }
        }),
      );

      return {
        vehicles: vehiclesWithPresignedUrls,
        vehiclesCount,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching vehicle: ${error.message}`);
    }
  }

  public async deleteVehicle(vehicleId: string): Promise<boolean> {
    try {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          is_deleted: false,
        },
      });

      if (!existingVehicle) {
        throw new HttpException(404, `Vehicle not found with id: ${vehicleId}`);
      }

      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          is_deleted: true,
          updated_at: new Date(),
        },
      });

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error deleting vehicle: ${error.message}`);
    }
  }
}
