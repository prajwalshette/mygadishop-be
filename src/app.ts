import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS, BASE_PATH } from '@config';
import { Routes } from '@interfaces/routes.interface';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';

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
      console.log('Health check request received');
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
}
