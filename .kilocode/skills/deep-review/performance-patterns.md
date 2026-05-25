# Padrões e Antipadrões de Performance

## Banco de dados
- **N+1 queries**: evite buscar relacionamentos dentro de loops. Use `leftJoin` ou `inArray`.
- **Índices**: colunas usadas em `WHERE`, `ORDER BY` e `JOIN` devem ter índices (ex: `survey_id` em `answers`).
- **Views materializadas**: para relatórios pesados, considere `surveys_enriched` (já existe).
- **Paginação**: use `limit` e `offset` ou cursor pagination para listagens grandes.

## Cache (Redis)
- Use `cacheGet` / `cacheSet` para dados frequentemente acessados (ex: permissões do usuário – TTL 60s).
- Nunca armazene objetos grandes (evite JSON com centenas de KB).
- Invalide cache explicitamente após mutações (ex: após atualizar permissões de um usuário).

## Filas (BullMQ)
- **Jobs lentos** (`export`) devem ser processados em workers separados.
- Configure `maxRetriesPerRequest: null` e `enableReadyCheck: false` para evitar timeouts com Upstash.
- Monitore jobs travados com `sanitizeJob` (opcional).

## Frontend
- **Lazy loading**: todas as rotas devem usar `lazyPage()`.
- **Evite renderizações desnecessárias**: use `React.memo` apenas em componentes pesados.
- **Consultas RTK Query**: utilize `providesTags` e `invalidatesTags` para evitar over-fetching.
- **Exportações**: use polling com `setInterval` (máx 2s) e limite de tentativas (ex: 3 falhas).

## Infraestrutura
- **Conexões HTTP**: use keep-alive e limite de concorrência.
- **Uploads**: prefira uploads diretos para R2 usando URLs pré-assinadas, evite passar pelo backend.
