import { config } from 'dotenv';
config({ path: `.env` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
  NODE_ENV,
  PORT,
  SECRET_KEY,
  LOG_FORMAT,
  LOG_DIR,
  ORIGIN,
  BASE_PATH,
  DATABASE_URL,
  AWS_REGION,
  S3_ACCESS_KEY_ID,
  S3_BUCKET_NAME,
  S3_SECRET_KEY,
  REDIS_CONNECTION_URL,
  SERVER_URL,
  SHADOW_DATABASE_URL,
} = process.env;
