---
name: fix-redis-connection
description: A brief description, shown to the model to help it understand when to use this skill
---

# Skill: Corrigir conexão Redis

## Passos
1. Verificar variáveis de ambiente: `REDIS_URL`, `UPSTASH_REDIS_REST_URL`.
2. Checar se o cliente ioredis tem as opções: `maxRetriesPerRequest: null`, `enableReadyCheck: false`, `family: 0`, `tls: { rejectUnauthorized: false }`.
3. Testar conectividade: `redis.ping()`.
4. Se for erro `Connection is closed`, ajustar `connectTimeout` e `keepAlive`.
5. Para BullMQ, garantir que o worker não está usando conexão padrão Redis (usar a mesma instância).
