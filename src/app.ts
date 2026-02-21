import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS, BASE_PATH, REDIS_CONNECTION_URL, PROCESS1QUEUE } from '@config';
import { Routes } from '@interfaces/routes.interface';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import { SingleTon } from '@utils/singleTon';
import { CustomerConsumer } from '@/consumers/customer.consumer';
import { th } from 'zod/v4/locales';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
    // this.initializeConsumers();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));

    const origins = ORIGIN ? ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:8085'];
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || origins.includes(origin) || origins.includes('*')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: CREDENTIALS,
      }),
    );

    this.app.use(hpp());
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
      }),
    );
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    const basePath = BASE_PATH.trim() ?? '/';

    this.app.get('/', (request, response) => {
      logger.info('Health check request received');
      return response.status(200).send({
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    });

    routes.forEach(route => {
      this.app.use(basePath, route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }

  /**
   * Initialize all consumers
   */
  private async initializeConsumers() {
    try {
      logger.info('Initializing customer consumer');
      const customerConsumer = new CustomerConsumer();
      SingleTon.initializeProcess1Instance({
        queueName: PROCESS1QUEUE,
        connectionString: REDIS_CONNECTION_URL,
        messageCallback: customerConsumer.processPayload.bind(customerConsumer),
        consume: true,
        workerCount: 4,
        concurrency: 10,
      });

      logger.info('All consumers initialized successfully');
    } catch (error) {
      logger.error(error, 'Failed to initialize consumers');
      throw error;
    }
  }

  public async shutdown() {
    try {
      logger.info('Shutting down gracefully...');
    } catch (error) {
      logger.error(error, 'Error during shutdown');
    }
  }
}
