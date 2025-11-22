import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import prisma from '@/database';
import { ulid } from 'ulid';
import { FuelType, IVehicle, VehicleType, TransmissionType, BikeStatus, OwnershipType } from '@/interfaces/vehicle.interface';
import { generateVehiclePresignedUrls } from './aws.service';
import { getCachedVehiclePresignedUrls } from '@/utils/cacheVehiclePresignedUrl';
import { logger } from '@utils/logger';
import { CreateVehicleDto, UpdateVehicleDto, GetVehicleQueryDto } from '@/schemas/vehicle.schema';

@Service()
export class VehicleService {
  private prisma = prisma;

  // -----------------------------
  // CREATE VEHICLE - Add new vehicle to inventory
  // -----------------------------
  public async createVehicle(vehicleData: IVehicle, shop_id: string): Promise<IVehicle> {
    try {
      const isExistVehicle = await this.prisma.vehicle.findFirst({
        where: { registration_number: vehicleData.registration_number, chassis_number: vehicleData.chassis_number, is_deleted: false, shop_id: shop_id },
      });

      if (isExistVehicle) {
        logger.warn(`Create vehicle failed: Vehicle already exists - Registration: ${vehicleData.registration_number}, Chassis: ${vehicleData.chassis_number}`);
        throw new ConflictException(
          `Vehicle already exists with registration_number: ${vehicleData.registration_number}, chassis_number: ${vehicleData.chassis_number}`,
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
      
      logger.info(`Vehicle created successfully: ${vehicle.registration_number} (${vehicle.id})`);
      return {
        ...vehicle,
        type: vehicle.type as VehicleType,
        fuel_type: vehicle.fuel_type as FuelType,
        transmission: vehicle.transmission as TransmissionType,
        status: vehicle.status as BikeStatus,
        ownership: vehicleData.ownership as OwnershipType,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create vehicle error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE VEHICLE - Modify existing vehicle details
  // -----------------------------
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
        logger.warn(`Update vehicle failed: Vehicle not found - ${vehicleId}`);
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
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
          logger.warn(`Update vehicle failed: Duplicate registration/chassis number`);
          throw new ConflictException(`Vehicle already exists with the same registration_number or chassis_number`);
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

      logger.info(`Vehicle updated successfully: ${updatedVehicle.registration_number} (${vehicleId})`);
      return {
        ...updatedVehicle,
        type: updatedVehicle.type as VehicleType,
        fuel_type: updatedVehicle.fuel_type as FuelType,
        transmission: updatedVehicle.transmission as TransmissionType,
        status: updatedVehicle.status as BikeStatus,
        ownership: updatedVehicle.ownership as OwnershipType,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET VEHICLE BY ID - Retrieve single vehicle
  // -----------------------------
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

        logger.info(`Vehicle retrieved successfully: ${vehicleId}`);
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
      logger.error(`Get vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET ALL VEHICLES - Retrieve paginated vehicle list
  // -----------------------------
  public async getAllVehicle(query: GetVehicleQueryDto, shop_id: string): Promise<any> {
    const { page, limit, search, status, type, sortBy, sortOrder } = query;
    
    try {
      const skip = (page - 1) * limit;

      // Build where clause with filters
      const whereClause: any = {
        shop_id: shop_id,
        is_deleted: false,
      };

      // Add search filter (searches across multiple fields)
      if (search) {
        whereClause.OR = [
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { variant: { contains: search, mode: 'insensitive' } },
          { registration_number: { contains: search, mode: 'insensitive' } },
          { chassis_number: { contains: search, mode: 'insensitive' } },
          { engine_number: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add type filter
      if (type) {
        whereClause.type = type;
      }

      // Fetch vehicles and total count in parallel using Promise.all
      const [vehicles, total] = await Promise.all([
        this.prisma.vehicle.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.vehicle.count({ where: whereClause }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

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
              ownership: vehicle.ownership as OwnershipType,
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
              ownership: vehicle.ownership as OwnershipType,
              // Fallback to original URLs
              vehicle_image_urls: vehicle.vehicle_image_urls || [],
              vehicle_doc_urls: vehicle.vehicle_doc_urls || [],
            };
          }
        }),
      );

      logger.info(`Retrieved ${total} vehicles (page ${page}, limit ${limit}, filters: ${JSON.stringify({ search, status, type })})`);
      
      return {
        vehicles: vehiclesWithPresignedUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Get all vehicles error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE VEHICLE - Soft delete vehicle from inventory
  // -----------------------------
  public async deleteVehicle(vehicleId: string): Promise<boolean> {
    try {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          is_deleted: false,
        },
      });

      if (!existingVehicle) {
        logger.warn(`Delete vehicle failed: Vehicle not found - ${vehicleId}`);
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          is_deleted: true,
          updated_at: new Date(),
        },
      });

      logger.info(`Vehicle deleted successfully: ${vehicleId}`);
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }
}
