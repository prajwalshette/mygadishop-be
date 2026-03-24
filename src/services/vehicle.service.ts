import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import prisma from '@/lib/prisma';
import { ulid } from 'ulid';
import { FuelType, IVehicle, VehicleType, TransmissionType, VehicleStatus, OwnershipType } from '@/interfaces/vehicle.interface';
import { generateVehiclePresignedUrls, getS3ObjectStream } from './aws.service';
import { getCachedVehiclePresignedUrls, deleteCachedVehiclePresignedUrls } from '@/utils/cacheVehiclePresignedUrl';
import { logger } from '@utils/logger';
import { CreateVehicleDto, UpdateVehicleDto, GetVehicleQueryDto, ExportVehicleQueryDto } from '@/schemas/vehicle.schema';

@Service()
export class VehicleService {
  private prisma = prisma;

  // -----------------------------
  // CREATE VEHICLE - Add new vehicle to inventory
  // -----------------------------
  public async createVehicle(vehicleData: IVehicle, shop_id: string): Promise<IVehicle> {
    try {
      const isExistVehicle = await this.prisma.vehicle.findFirst({
        where: {
          registration_number: vehicleData.registration_number,
          chassis_number: vehicleData.chassis_number,
          deleted_at: null,
          shop_id: shop_id,
        },
      });

      if (isExistVehicle) {
        logger.warn(
          `Create vehicle failed: Vehicle already exists - Registration: ${vehicleData.registration_number}, Chassis: ${vehicleData.chassis_number}`,
        );
        throw new ConflictException(
          `Vehicle already exists with registration_number: ${vehicleData.registration_number}, chassis_number: ${vehicleData.chassis_number}`,
        );
      }

      // Remove price field if it exists (not in Prisma schema)
      const { price, ...vehicleDataWithoutPrice } = vehicleData as any;

      const vehicle = await this.prisma.vehicle.create({
        data: {
          id: ulid(),
          shop_id: shop_id,
          ...vehicleDataWithoutPrice,
          selling_date: vehicleData.selling_date ? new Date(vehicleData.selling_date) : null,
          buying_date: vehicleData.buying_date ? new Date(vehicleData.buying_date) : null,
          insurance_valid_till: vehicleData.insurance_valid_till ? new Date(vehicleData.insurance_valid_till) : null,
        } as Prisma.VehicleUncheckedCreateInput,
      });

      logger.info(`Vehicle created successfully: ${vehicle.registration_number} (${vehicle.id})`);
      return {
        ...vehicle,
        type: vehicle.type as VehicleType,
        fuel_type: vehicle.fuel_type as FuelType,
        transmission: vehicle.transmission as TransmissionType,
        status: vehicle.status as VehicleStatus,
        ownership: vehicle.ownership as OwnershipType,
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
          deleted_at: null,
        },
      });

      if (!existingVehicle) {
        logger.warn(`Update vehicle failed: Vehicle not found - ${vehicleId}`);
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      // Remove price field if it exists (not in Prisma schema)
      const { price, ...vehicleDataWithoutPrice } = vehicleData as any;

      // Check if registration_number or chassis_number is being updated and already exists
      if (vehicleDataWithoutPrice.registration_number || vehicleDataWithoutPrice.chassis_number) {
        const duplicateVehicle = await this.prisma.vehicle.findFirst({
          where: {
            OR: [
              ...(vehicleDataWithoutPrice.registration_number ? [{ registration_number: vehicleDataWithoutPrice.registration_number }] : []),
              ...(vehicleData.chassis_number ? [{ chassis_number: vehicleData.chassis_number }] : []),
            ],
            AND: [
              { id: { not: vehicleId } }, // Exclude current vehicle
              { deleted_at: null },
            ],
          },
        });

        if (duplicateVehicle) {
          logger.warn(`Update vehicle failed: Duplicate registration/chassis number`);
          throw new ConflictException(`Vehicle already exists with the same registration_number or chassis_number`);
        }
      }

      // Remove id from update data if present (shouldn't be updated)
      // price is already removed above
      const { id, ...updateData } = vehicleDataWithoutPrice;

      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...updateData,
          updated_at: new Date(),
          selling_date: vehicleDataWithoutPrice.selling_date ? new Date(vehicleDataWithoutPrice.selling_date) : existingVehicle.selling_date,
          buying_date: vehicleDataWithoutPrice.buying_date ? new Date(vehicleDataWithoutPrice.buying_date) : existingVehicle.buying_date,
          insurance_valid_till: vehicleDataWithoutPrice.insurance_valid_till
            ? new Date(vehicleDataWithoutPrice.insurance_valid_till)
            : existingVehicle.insurance_valid_till,
        } as Prisma.VehicleUncheckedCreateInput,
      });

      logger.info(`Vehicle updated successfully: ${updatedVehicle.registration_number} (${vehicleId})`);

      // Invalidate presigned URL cache
      await deleteCachedVehiclePresignedUrls(vehicleId);

      return {
        ...updatedVehicle,
        type: updatedVehicle.type as VehicleType,
        fuel_type: updatedVehicle.fuel_type as FuelType,
        transmission: updatedVehicle.transmission as TransmissionType,
        status: updatedVehicle.status as VehicleStatus,
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
          deleted_at: null,
        },
        include: {
          customer: true,
          services: true,
          payments: true,
        },
      });

      if (!vehicle) {
        return null;
      }

      try {
        let presignedUrls = await getCachedVehiclePresignedUrls(vehicleId);
        if (!presignedUrls) {
          logger.info(`Cache miss for vehicle ${vehicleId}, generating new presigned URLs`);
          presignedUrls = await generateVehiclePresignedUrls(
            vehicleId,
            vehicle.vehicle_image_urls || [],
            vehicle.vehicle_doc_urls || [],
            3600, // 1 hour expiration
          );
        }

        logger.info(`Vehicle retrieved successfully: ${vehicleId}`);
        return {
          ...vehicle,
          type: vehicle.type as VehicleType,
          fuel_type: vehicle.fuel_type as FuelType,
          transmission: vehicle.transmission as TransmissionType,
          status: vehicle.status as VehicleStatus,
          vehicle_image_urls: presignedUrls?.imageUrls || vehicle.vehicle_image_urls || [],
          vehicle_doc_urls: presignedUrls?.docUrls || vehicle.vehicle_doc_urls || [],
          ownership: vehicle.ownership as OwnershipType,
        };
      } catch (urlError) {
        logger.error(urlError, `Error processing URLs for vehicle ${vehicleId}`);
        return {
          ...vehicle,
          type: vehicle.type as VehicleType,
          fuel_type: vehicle.fuel_type as FuelType,
          transmission: vehicle.transmission as TransmissionType,
          status: vehicle.status as VehicleStatus,
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

  /**
   * Get first vehicle image as stream for share (proxied from S3 to avoid CORS).
   * Returns null if vehicle not found, not owned by shop, or no images.
   */
  public async getVehicleShareImageStream(
    vehicleId: string,
    shop_id: string,
  ): Promise<{ stream: import('stream').Readable; contentType: string } | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, shop_id, deleted_at: null },
      select: { vehicle_image_urls: true },
    });
    if (!vehicle?.vehicle_image_urls?.length) {
      return null;
    }
    const firstImageUrl = vehicle.vehicle_image_urls[0];
    const result = await getS3ObjectStream(firstImageUrl);
    if (!result?.Body) {
      return null;
    }
    return {
      stream: result.Body,
      contentType: result.ContentType ?? 'image/jpeg',
    };
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
        deleted_at: null,
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
              logger.info(`Cache miss for vehicle ${vehicle.id}, generating new presigned URLs`);
              presignedUrls = await generateVehiclePresignedUrls(
                vehicle.id,
                vehicle.vehicle_image_urls || [],
                vehicle.vehicle_doc_urls || [],
                3600, // 1 hour expiration
              );
            }

            // Return vehicle with presigned URLs
            return {
              ...vehicle,
              type: vehicle.type as VehicleType,
              fuel_type: vehicle.fuel_type as FuelType,
              transmission: vehicle.transmission as TransmissionType,
              status: vehicle.status as VehicleStatus,
              ownership: vehicle.ownership as OwnershipType,
              vehicle_image_urls: presignedUrls?.imageUrls || [],
              vehicle_doc_urls: presignedUrls?.docUrls || [],
            };
          } catch (urlError) {
            logger.error(urlError, `Error processing URLs for vehicle ${vehicle.id}`);
            // Return vehicle with original URLs if presigned URL generation fails
            return {
              ...vehicle,
              type: vehicle.type as VehicleType,
              fuel_type: vehicle.fuel_type as FuelType,
              transmission: vehicle.transmission as TransmissionType,
              status: vehicle.status as VehicleStatus,
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
  // GET VEHICLE STATISTICS - Get vehicle stats for dashboard
  // -----------------------------
  public async getVehicleStats(shop_id: string): Promise<any> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Total vehicles
      const totalVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
        },
      });

      // Available vehicles
      const availableVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'AVAILABLE',
        },
      });

      // Sold vehicles this month
      const soldThisMonth = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'SOLD',
          created_at: { gte: startOfCurrentMonth },
        },
      });

      // Maintenance vehicles
      const maintenanceVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'MAINTENANCE',
        },
      });

      // New vehicles this month
      const newThisMonth = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: { gte: startOfCurrentMonth },
        },
      });

      // Vehicles from last month
      const lastMonthVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      });

      // Calculate growth rate
      const growthRate =
        lastMonthVehicles > 0 ? Math.round(((newThisMonth - lastMonthVehicles) / lastMonthVehicles) * 100) : newThisMonth > 0 ? 100 : 0;

      logger.info(
        `Retrieved vehicle stats for shop ${shop_id}: total=${totalVehicles}, available=${availableVehicles}, soldThisMonth=${soldThisMonth}, maintenance=${maintenanceVehicles}, newThisMonth=${newThisMonth}, growthRate=${growthRate}%`,
      );

      return {
        totalVehicles,
        availableVehicles,
        soldThisMonth,
        maintenanceVehicles,
        newThisMonth,
        growthRate,
        lastMonthVehicles,
      };
    } catch (error) {
      logger.error(`Get vehicle stats error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // EXPORT VEHICLES - Get all vehicles for CSV export (no pagination)
  // -----------------------------
  public async exportVehicles(query: ExportVehicleQueryDto, shop_id: string): Promise<IVehicle[]> {
    const { search, status, type, sortBy, sortOrder } = query;

    try {
      // Build where clause with filters
      const whereClause: any = {
        shop_id: shop_id,
        deleted_at: null,
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

      // Fetch all vehicles without pagination
      const vehicles = await this.prisma.vehicle.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
      });

      logger.info(`Exporting ${vehicles.length} vehicles (filters: ${JSON.stringify({ search, status, type })})`);

      return vehicles.map(vehicle => ({
        ...vehicle,
        type: vehicle.type as VehicleType,
        fuel_type: vehicle.fuel_type as FuelType,
        transmission: vehicle.transmission as TransmissionType,
        status: vehicle.status as VehicleStatus,
        ownership: vehicle.ownership as OwnershipType,
      }));
    } catch (error) {
      logger.error(`Export vehicles error: ${error.message}`);
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
          deleted_at: null,
        },
      });

      if (!existingVehicle) {
        logger.warn(`Delete vehicle failed: Vehicle not found - ${vehicleId}`);
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          deleted_at: new Date(),
          updated_at: new Date(),
        },
      });

      logger.info(`Vehicle deleted successfully: ${vehicleId}`);

      // Invalidate presigned URL cache
      await deleteCachedVehiclePresignedUrls(vehicleId);

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }
}
