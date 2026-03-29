import redis from '@/config/redis';
import { logger } from '@/utils/logger';

type VehiclePresignedCache = {
  vehicle_id: string;
  imageUrls: string[];
  docUrls: string[];
  createdAt: string;
  expiresAt: string;
};

type VehicleUrlData = {
  imageUrls: string[];
  /** @deprecated Preserved for older cache entries; document URLs are presigned per row in the vehicle service. */
  docUrls?: string[];
};

const getVehicleCacheKey = (vehicle_id: string) => `vehicle_presigned:${vehicle_id}`;

export const setVehiclePresignedCache = async (
  vehicle_id: string,
  imageUrls: string[] = [],
  docUrls: string[] = [],
  expiresIn: number = 3600,
): Promise<boolean> => {
  try {
    const cacheData: VehiclePresignedCache = {
      vehicle_id,
      imageUrls,
      docUrls,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };

    const cacheTtl = Math.max(expiresIn - 300, 300);
    await redis.setex(getVehicleCacheKey(vehicle_id), cacheTtl, JSON.stringify(cacheData));

    logger.info(`Cached presigned URLs for vehicle: ${vehicle_id}, TTL: ${cacheTtl}s`);
    return true;
  } catch (error) {
    logger.error(error, 'Error caching vehicle presigned URLs');
    return false;
  }
};

export const getVehiclePresignedCache = async (vehicle_id: string): Promise<VehicleUrlData | null> => {
  try {
    const cached = await redis.get(getVehicleCacheKey(vehicle_id));
    if (!cached) {
      logger.debug(`No cache found for vehicle: ${vehicle_id}`);
      return null;
    }

    const parsed: VehiclePresignedCache = JSON.parse(cached);

    const now = new Date();
    const expiresAt = new Date(parsed.expiresAt);

    if (now >= expiresAt) {
      logger.info(`Cache expired for vehicle: ${vehicle_id}, removing...`);
      await deleteVehiclePresignedCache(vehicle_id);
      return null;
    }

    logger.debug(`Retrieved cached URLs for vehicle: ${vehicle_id}`);
    return { imageUrls: parsed.imageUrls, docUrls: parsed.docUrls ?? [] };
  } catch (error) {
    logger.error(error, 'Error getting cached vehicle presigned URLs');
    return null;
  }
};

export const deleteVehiclePresignedCache = async (vehicle_id: string): Promise<boolean> => {
  try {
    const result = await redis.del(getVehicleCacheKey(vehicle_id));
    const deleted = result > 0;

    if (deleted) {
      logger.info(`Deleted cache for vehicle: ${vehicle_id}`);
    } else {
      logger.debug(`No cache found to delete for vehicle: ${vehicle_id}`);
    }

    return deleted;
  } catch (error) {
    logger.error(error, 'Error deleting cached vehicle presigned URLs');
    return false;
  }
};

