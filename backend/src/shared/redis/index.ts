// src/shared/redis/index.ts
import Redis from 'ioredis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions: Record<string, any> = {
  tls: url.startsWith('rediss://') ? {} : undefined,
  family: 0, // 0 = auto (resolve IPv4/IPv6)
  retryStrategy(times: number) {
    if (times > 10) return undefined;
    return Math.min(times * 200, 2000);
  },
  maxRetriesPerRequest: null, // necessário para o Bull
};

// Suporte para módulos ES – a exportação padrão pode não ser a classe Redis
export const redis = new (Redis as any)(url, redisOptions);
