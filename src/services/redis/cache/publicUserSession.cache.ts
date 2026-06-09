import redis from '@/config/redis';
import { logger } from '@utils/logger';

/** Public app sessions live only in Redis (no DB session table). TTL matches JWT (24h). */
export const PUBLIC_USER_SESSION_TTL_SEC = 60 * 60 * 24;

export interface CachedPublicUserSession {
  public_user_id: string;
  cached_at: string;
  device_info?: Record<string, unknown>;
  ip_address?: string | null;
}

const key = (sessionId: string): string => `public_user_session:${sessionId}`;

export class PublicUserSessionCache {
  static async setSession(sessionId: string, data: CachedPublicUserSession, ttlSec: number = PUBLIC_USER_SESSION_TTL_SEC): Promise<void> {
    const redisKey = key(sessionId);
    await redis.setex(redisKey, ttlSec, JSON.stringify(data));
    logger.debug(`Public user session cached: ${sessionId} (ttl ${ttlSec}s)`);
  }

  static async getSession(sessionId: string): Promise<CachedPublicUserSession | null> {
    try {
      const raw = await redis.get(key(sessionId));
      if (!raw) {
        logger.debug(`Public user session cache miss: ${sessionId}`);
        return null;
      }
      logger.debug(`Public user session cache hit: ${sessionId}`);
      return JSON.parse(raw) as CachedPublicUserSession;
    } catch (error) {
      logger.error(`Failed to read public user session ${sessionId}: ${(error as Error).message}`);
      return null;
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    try {
      await redis.del(key(sessionId));
      logger.debug(`Public user session removed: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to delete public user session ${sessionId}: ${(error as Error).message}`);
    }
  }

  static async exists(sessionId: string): Promise<boolean> {
    try {
      return (await redis.exists(key(sessionId))) === 1;
    } catch (error) {
      logger.error(`Failed to check public user session ${sessionId}: ${(error as Error).message}`);
      return false;
    }
  }

  static async getTTL(sessionId: string): Promise<number> {
    try {
      return await redis.ttl(key(sessionId));
    } catch (error) {
      logger.error(`Failed to get TTL for public user session ${sessionId}: ${(error as Error).message}`);
      return -1;
    }
  }
}
