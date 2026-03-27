import { DispatchException } from '@/exceptions';
import { logger } from '@utils/logger';
import { BullQueue } from '../redisBullMQ';

export class QueueService {
  static process1Client: BullQueue; //Customer

  static initializeProcess1Instance(params: {
    queueName: string;
    connectionString: string;
    messageCallback?: Function;
    consume?: boolean;
    workerCount?: number;
    concurrency?: number;
  }) {
    const { queueName, connectionString, messageCallback, consume = false, workerCount = 4, concurrency = 10 } = params;

    if (QueueService.process1Client) {
      logger.warn('Process1 instance already exists. Closing existing instance.');
      QueueService.process1Client.close().catch(err => logger.error(err, 'Error closing Process11 instance'));
    }

    try {
      QueueService.process1Client = new BullQueue(queueName, connectionString, messageCallback, consume, workerCount, concurrency);
      logger.info(`Process1 BullQueue instance initialized with ${workerCount} workers, ${concurrency} concurrency each, consume: ${consume}`);
    } catch (error) {
      logger.error(error, 'Failed to initialize Process1 instance');
      throw error;
    }
  }

  static getProcess1QueueInstance(): BullQueue {
    if (!QueueService.process1Client) {
      logger.error('process1Client instance not found.');
      throw new DispatchException(DispatchException.REDIS_QUEUE_EXCEPTION, 'Instance not found.', 'process1Client instance not found.');
    }
    return QueueService.process1Client;
  }

  /**
   * Health check methods
   */
  static async getQueueStats() {
    const stats = {
      process1: null,
    };

    try {
      if (QueueService.process1Client) {
        const queue = QueueService.process1Client.getQueue();
        stats.process1 = {
          waiting: await queue.getWaiting().then(jobs => jobs.length),
          active: await queue.getActive().then(jobs => jobs.length),
          completed: await queue.getCompleted().then(jobs => jobs.length),
          failed: await queue.getFailed().then(jobs => jobs.length),
        };
      }
    } catch (error) {
      logger.error(error, 'Error getting queue stats');
    }

    return stats;
  }

  static isInitialized(): {
    process1: boolean;
  } {
    return {
      process1: !!QueueService.process1Client,
    };
  }
}
