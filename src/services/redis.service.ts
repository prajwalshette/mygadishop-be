import Redis from 'ioredis';
import { Service } from 'typedi';
import { REDIS_CONNECTION_URL } from '@config';
import { logger } from '@utils/logger';

@Service()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(REDIS_CONNECTION_URL);

    this.client.on('error', err => {
      logger.error(err, 'Redis Client Error');
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  public async setSyncStatus(shop_id: string, upload_id: string, status: any, ttl: number = 86400): Promise<void> {
    const key = `customer_sync_status:${shop_id}:${upload_id}`;
    await this.client.set(key, JSON.stringify(status), 'EX', ttl);
  }

  public async getSyncStatus(shop_id: string, upload_id: string): Promise<any> {
    const key = `customer_sync_status:${shop_id}:${upload_id}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async updateSyncProcessedCount(shop_id: string, upload_id: string, increment: number): Promise<void> {
    const status = await this.getSyncStatus(shop_id, upload_id);
    if (status) {
      status.processed = (status.processed || 0) + increment;
      await this.setSyncStatus(shop_id, upload_id, status);
    }
  }

  public async setSyncError(shop_id: string, upload_id: string, error: string): Promise<void> {
    const status = await this.getSyncStatus(shop_id, upload_id);
    if (status) {
      status.status = 'FAILED';
      status.error = error;
      await this.setSyncStatus(shop_id, upload_id, status);
    }
  }

  public async completeSync(shop_id: string, upload_id: string): Promise<void> {
    const status = await this.getSyncStatus(shop_id, upload_id);
    if (status) {
      status.status = 'COMPLETED';
      status.processed = status.total;
      await this.setSyncStatus(shop_id, upload_id, status);
    }
  }
}
