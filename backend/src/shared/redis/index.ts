// src/shared/redis/index.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions: Record<string, any> = {
  // Essencial para o Bull e para evitar o MaxRetriesPerRequestError
  maxRetriesPerRequest: null,

  // Configuração de TLS. Se a URL for rediss://, ativa o TLS com uma configuração
  // que ignora a verificação de autoridade do certificado,
  // que é um workaround conhecido para a compatibilidade com o Upstash.
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,

  // Solução para o erro "Connection is closed":
  // Faz o ioredis não esperar indefinidamente por comandos de bloqueio.
  disconnectTimeout: 0,

  // Força a resolução de DNS para IPv6, que resolve problemas de conectividade
  // com o Upstash em certos ambientes de cloud (Render, Fly.io, etc.).
  family: 0,

  // Mantém a conexão TCP ativa, evitando que firewalls ou proxies a derrubem.
  keepAlive: 5000,
  connectTimeout: 10000,

  // Estratégia de retry: tenta reconectar até 10 vezes, com um pequeno delay.
  retryStrategy(times: number) {
    if (times > 10) return undefined;
    return Math.min(times * 200, 2000);
  },

  // Habilita prontidão: o cliente só aceitará comandos quando a conexão estiver estabelecida.
  enableReadyCheck: true,

  // Reconecta automaticamente em erros de conexão (ECONNRESET, ECONNREFUSED, READONLY).
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    return targetErrors.some((msg) => err.message.includes(msg));
  },
};

console.log(`🔌 Conectando ao Redis (${redisUrl.startsWith('rediss://') ? 'TLS' : 'não-TLS'})...`);
export const redis = new (Redis as any)(redisUrl, redisOptions);
