import Redis from 'ioredis';
import { REDIS_CONNECTION_URL } from '@/config/env';

const redis = new Redis(REDIS_CONNECTION_URL);

export default redis;
