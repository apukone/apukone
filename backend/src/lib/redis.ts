import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl);
export const pub = new Redis(redisUrl);
export const sub = new Redis(redisUrl);
