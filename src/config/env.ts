import { config } from 'dotenv';
import { z } from 'zod';

config({ path: `.env` });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().min(1, 'PORT is required'),
  SECRET_KEY: z.string().min(1, 'SECRET_KEY is required'),
  CREDENTIALS: z
    .string()
    .optional()
    .default('false')
    .transform(val => val === 'true'),

  // Logging
  LOG_FORMAT: z.string().optional(),
  LOG_DIR: z.string().optional(),

  // CORS / Server
  ORIGIN: z.string().min(1, 'ORIGIN is required'),
  BASE_PATH: z.string().optional(),
  SERVER_URL: z.string().url('SERVER_URL must be a valid URL'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  SHADOW_DATABASE_URL: z.string().url('SHADOW_DATABASE_URL must be a valid URL').optional(),

  // AWS / S3
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY is required'),

  // Redis
  REDIS_CONNECTION_URL: z.string().url('REDIS_CONNECTION_URL must be a valid URL'),

  // Queues
  PROCESS1QUEUE: z.string().min(1, 'PROCESS1QUEUE is required'),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  const errors = _parsed.error.issues
    .map(err => `  ✗ ${err.path.join('.')}: ${err.message}`)
    .join('\n');

  console.error('\n❌ Invalid / missing environment variables:\n');
  console.error(errors);
  console.error('\nFix the above variables in your .env file and restart the server.\n');
  process.exit(1);
}

const env = _parsed.data;

export const CREDENTIALS = env.CREDENTIALS;
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const SECRET_KEY = env.SECRET_KEY;
export const LOG_FORMAT = env.LOG_FORMAT;
export const LOG_DIR = env.LOG_DIR;
export const ORIGIN = env.ORIGIN;
export const BASE_PATH = env.BASE_PATH;
export const DATABASE_URL = env.DATABASE_URL;
export const AWS_REGION = env.AWS_REGION;
export const S3_ACCESS_KEY_ID = env.S3_ACCESS_KEY_ID;
export const S3_BUCKET_NAME = env.S3_BUCKET_NAME;
export const S3_SECRET_KEY = env.S3_SECRET_KEY;
export const REDIS_CONNECTION_URL = env.REDIS_CONNECTION_URL;
export const PROCESS1QUEUE = env.PROCESS1QUEUE;
export const SERVER_URL = env.SERVER_URL;
export const SHADOW_DATABASE_URL = env.SHADOW_DATABASE_URL;
export const RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
export const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
export const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET;