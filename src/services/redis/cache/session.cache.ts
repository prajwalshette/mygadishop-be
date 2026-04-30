import redis from '@/config/redis';
import { User, AdminUser } from '@/modules/user/user.interface';
import { logger } from '@utils/logger';

export interface CachedSessionData {
  user: User;
  session_id: string;
  shop_id: string;
  cached_at: string;
}

export interface CachedAdminSessionData {
  admin: AdminUser;
  session_id: string;
  cached_at: string;
}

export type SessionType = 'user' | 'admin';

export class SessionCache {
  /**
   * Generate Redis key for session cache
   * @param session_id - Session ID from JWT token
   * @param type - Session type ('user' or 'admin')
   */
  private static getKey(session_id: string, type: SessionType = 'user'): string {
    const prefix = type === 'admin' ? 'admin_session' : 'session';
    return `${prefix}:${session_id}`;
  }

  /**
   * Store user session data in Redis cache
   * @param session_id - Session ID
   * @param user - User object
   * @param shop_id - Shop ID
   * @param expiresIn - Cache expiration time in seconds (should match JWT expiry)
   */
  static async setSession(session_id: string, user: User, shop_id: string, expiresIn: number): Promise<void> {
    try {
      const key = this.getKey(session_id, 'user');
      const sessionData: CachedSessionData = {
        user,
        session_id,
        shop_id,
        cached_at: new Date().toISOString(),
      };

      await redis.setex(key, expiresIn, JSON.stringify(sessionData));
      logger.debug(`User session cached: ${session_id} (expires in ${expiresIn}s)`);
    } catch (error) {
      logger.error(`Failed to cache user session ${session_id}: ${error.message}`);
      // Don't throw error - caching failure shouldn't break authentication
    }
  }

  /**
   * Store admin session data in Redis cache
   * @param session_id - Session ID
   * @param admin - Admin user object
   * @param expiresIn - Cache expiration time in seconds (should match JWT expiry)
   */
  static async setAdminSession(session_id: string, admin: AdminUser, expiresIn: number): Promise<void> {
    try {
      const key = this.getKey(session_id, 'admin');
      const sessionData: CachedAdminSessionData = {
        admin,
        session_id,
        cached_at: new Date().toISOString(),
      };

      await redis.setex(key, expiresIn, JSON.stringify(sessionData));
      logger.debug(`Admin session cached: ${session_id} (expires in ${expiresIn}s)`);
    } catch (error) {
      logger.error(`Failed to cache admin session ${session_id}: ${error.message}`);
      // Don't throw error - caching failure shouldn't break authentication
    }
  }

  /**
   * Retrieve user session data from Redis cache
   * @param session_id - Session ID
   * @returns Cached session data or null if not found/expired
   */
  static async getSession(session_id: string): Promise<CachedSessionData | null> {
    try {
      const key = this.getKey(session_id, 'user');
      const data = await redis.get(key);

      if (!data) {
        logger.debug(`User session cache miss: ${session_id}`);
        return null;
      }

      logger.debug(`User session cache hit: ${session_id}`);
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Failed to retrieve user session ${session_id} from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Retrieve admin session data from Redis cache
   * @param session_id - Session ID
   * @returns Cached admin session data or null if not found/expired
   */
  static async getAdminSession(session_id: string): Promise<CachedAdminSessionData | null> {
    try {
      const key = this.getKey(session_id, 'admin');
      const data = await redis.get(key);

      if (!data) {
        logger.debug(`Admin session cache miss: ${session_id}`);
        return null;
      }

      logger.debug(`Admin session cache hit: ${session_id}`);
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Failed to retrieve admin session ${session_id} from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete session from Redis cache (used on logout)
   * @param session_id - Session ID
   * @param type - Session type ('user' or 'admin')
   */
  static async deleteSession(session_id: string, type: SessionType = 'user'): Promise<void> {
    try {
      const key = this.getKey(session_id, type);
      await redis.del(key);
      logger.debug(`${type === 'admin' ? 'Admin' : 'User'} session deleted from cache: ${session_id}`);
    } catch (error) {
      logger.error(`Failed to delete ${type} session ${session_id} from cache: ${error.message}`);
      // Don't throw error - cache deletion failure shouldn't break logout
    }
  }

  /**
   * Check if session exists in cache
   * @param session_id - Session ID
   * @param type - Session type ('user' or 'admin')
   * @returns true if session exists in cache
   */
  static async exists(session_id: string, type: SessionType = 'user'): Promise<boolean> {
    try {
      const key = this.getKey(session_id, type);
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Failed to check ${type} session existence ${session_id}: ${error.message}`);
      return false;
    }
  }

  /**
   * Update TTL for existing session (useful for session refresh)
   * @param session_id - Session ID
   * @param expiresIn - New expiration time in seconds
   * @param type - Session type ('user' or 'admin')
   */
  static async refreshSession(session_id: string, expiresIn: number, type: SessionType = 'user'): Promise<void> {
    try {
      const key = this.getKey(session_id, type);
      await redis.expire(key, expiresIn);
      logger.debug(`${type === 'admin' ? 'Admin' : 'User'} session TTL refreshed: ${session_id} (expires in ${expiresIn}s)`);
    } catch (error) {
      logger.error(`Failed to refresh ${type} session ${session_id}: ${error.message}`);
    }
  }

  /**
   * Get remaining TTL for a session
   * @param session_id - Session ID
   * @param type - Session type ('user' or 'admin')
   * @returns Remaining TTL in seconds, or -1 if key doesn't exist, -2 if no expiry set
   */
  static async getTTL(session_id: string, type: SessionType = 'user'): Promise<number> {
    try {
      const key = this.getKey(session_id, type);
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Failed to get TTL for ${type} session ${session_id}: ${error.message}`);
      return -1;
    }
  }
}
