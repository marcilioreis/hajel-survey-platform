import * as Redis from 'ioredis';
export const redis = new (Redis as any).default(process.env.REDIS_URL);
