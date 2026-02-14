import { DispatchException } from '@/exceptions';
import { Job, Queue, Worker, QueueEvents } from 'bullmq';
import { logger } from './logger';

export class BullQueue {
  private activeQueue: Queue = null;
  private workers: Worker[] = [];
  private worker: Worker = null;
  private messageCallback?: Function = null;
  private queueEvents: QueueEvents = null;
  private workerCount: number = 1;

  constructor(
    queueName: string,
    connectionString: string,
    callbackFunction?: Function,
    consume: boolean = false,
    workerCount: number = 1,
    concurrency: number = 10,
  ) {
    if (!queueName || typeof queueName !== 'string') {
      throw new DispatchException(DispatchException.REDIS_QUEUE_EXCEPTION, `Invalid queue name`, `Invalid queue name encountered: ${queueName}`);
    }

    this.messageCallback = callbackFunction;
    this.workerCount = workerCount;

    // connectionString is the full URL (e.g., redis://... or rediss://...)
    this.activeQueue = new Queue(`${queueName}`, {
      connection: connectionString as any,
    });

    this.queueEvents = new QueueEvents(queueName, {
      connection: connectionString as any,
    });

    logger.info(`Connecting to Redis URL : ${connectionString} with queue : ${queueName}.`);

    if (consume === true && this.messageCallback) {
      this.createWorkerPool(queueName, connectionString, concurrency);
    }
  }

  private createWorkerPool(queueName: string, connectionString: string, concurrency: number) {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(
        queueName,
        async (job: Job) => {
          return await this.processQueueJob(job);
        },
        {
          connection: connectionString as any,
          concurrency: concurrency,
          lockDuration: 30000,
          stalledInterval: 30000,
          maxStalledCount: 1,
        },
      );

      // Add event listeners for each worker
      worker.on('completed', job => {
        logger.debug(`Worker ${i} - Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        logger.error(err, `Worker ${i} - Job ${job?.id} failed`);
      });

      worker.on('active', job => {
        logger.debug(`Worker ${i} - Job ${job.id} is now active`);
      });

      worker.on('error', err => {
        logger.error(err, `Worker ${i} error`);
      });

      worker.on('stalled', jobId => {
        logger.warn(`Worker ${i} - Job ${jobId} stalled`);
      });

      this.workers.push(worker);
      logger.info(`Worker ${i} initialized for queue ${queueName}`);
    }

    logger.info(`Created ${this.workerCount} workers with ${concurrency} concurrency each for queue ${queueName}`);
  }

  /**
   * processQueueJob
   * @description Processes individual queue job using the provided callback function.
   */
  private async processQueueJob(job: Job) {
    const startTime = Date.now();
    try {
      logger.debug({ jobData: job.data }, `Processing job ${job.id}`);
      if (this.messageCallback) {
        const result = await this.messageCallback(job);
        const processingTime = Date.now() - startTime;
        logger.debug(`Job ${job.id} processed in ${processingTime}ms`);
        return result;
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(error, `Failed to process job ${job.id} after ${processingTime}ms`);
      throw new DispatchException(DispatchException.REDIS_QUEUE_EXCEPTION, 'Failed to process job.', JSON.stringify(error));
    }
  }

  // ================== Dealer And Audiecnce Queue Methods ==================
  public async addJobIntoQueue(payload: any) {
    try {
      const job = await this.activeQueue.add('process', payload, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      logger.info(`Job ${job.id} added to queue`);
      return job;
    } catch (error) {
      logger.error(error, 'Failed to add job to queue');
      throw new DispatchException(DispatchException.REDIS_QUEUE_EXCEPTION, 'Failed to add job to queue', JSON.stringify(error));
    }
  }

  /**
   * closeConnections
   * @description Closes all BullMQ connections (queue and worker) gracefully.
   */
  public async closeConnections() {
    try {
      if (this.worker) {
        await this.worker.close();
      }
      if (this.activeQueue) {
        await this.activeQueue.close();
      }
      logger.info('BullMQ connections closed successfully');
    } catch (error) {
      logger.error(error, 'Error closing BullMQ connections');
    }
  }

  /**
   * @description Returns the active queue instance.
   */
  public getQueue(): Queue {
    return this.activeQueue;
  }

  public async resumeQueue() {
    await this.activeQueue.resume();
    logger.info('Queue resumed');
  }

  /**
   * getWorker
   * @returns {Worker}
   * @description Returns the active worker instance.
   */
  public getWorker(): Worker {
    return this.worker;
  }

  /**
   * Close connections
   */
  public async close() {
    try {
      // Close all workers
      await Promise.all(this.workers.map(worker => worker.close()));
      this.workers = [];

      // Close queue events
      if (this.queueEvents) {
        await this.queueEvents.close();
      }

      // Close queue
      if (this.activeQueue) {
        await this.activeQueue.close();
      }

      logger.info('BullQueue instance closed successfully');
    } catch (error) {
      logger.error(error, 'Error closing BullQueue instance');
      throw error;
    }
  }
}
