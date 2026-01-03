import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import pino from 'pino';
import { LOG_DIR } from '@config';

const isProduction = process.env.NODE_ENV === 'production';

// Pino configuration
const logger = pino(
  {
    level: isProduction ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  // Only use pino-pretty transport in development
  // In production, use simple JSON output (serverless-friendly)
  !isProduction
    ? pino.transport({
        targets: [
          // Console transport with pretty printing
          {
            target: 'pino-pretty',
            level: 'debug',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          },
          // File logging
          {
            target: 'pino/file',
            level: 'debug',
            options: {
              destination: join(__dirname, LOG_DIR, 'debug', `${new Date().toISOString().split('T')[0]}.log`),
              mkdir: true,
            },
          },
          {
            target: 'pino/file',
            level: 'error',
            options: {
              destination: join(__dirname, LOG_DIR, 'error', `${new Date().toISOString().split('T')[0]}.log`),
              mkdir: true,
            },
          },
        ],
      })
    : undefined, // In production, just use stdout with JSON
);

// Stream for Morgan or other HTTP loggers
const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
