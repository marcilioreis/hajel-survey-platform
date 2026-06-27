---
name: deep-review
description: >-
  Use para uma revisão de código PROFUNDA e sistemática no Hajel Survey,
  cobrindo segurança, performance, estilo/convenções, tratamento de erros e
  gerenciamento de recursos. Apropriada para revisar um PR inteiro, um módulo,
  ou um arquivo crítico antes do merge. Para revisão rápida de um diff recente,
  prefira o subagent code-reviewer.
---

# Deep Code Review

Revisão sistemática de código do Hajel Survey. Consulte os references desta skill
conforme o passo. Explore o código em paralelo (vários Grep/Read de uma vez) e baseie
conclusões em entendimento real, não em palpite.

## Passo 1 — Escopo
Peça (ou infira do git diff) o que revisar: PR, módulo ou arquivo. Se nada for dado,
analise as mudanças não commitadas: `git diff HEAD` e `git diff --staged`.

## Passo 2 — Segurança
Aplique `references/security-checklist.md` item a item. Pontos quentes do Hajel:
- Toda entrada validada por Zod (`validateBody`/`validateParams`/`validateQuery`).
- Rotas sensíveis com `authenticate` + `loadPermissions` + `authorize('code')`.
- Admin sem permissões implícitas perigosas (só via RBAC; `req.isAdmin` é atalho — confirme intenção).
- Queries via Drizzle parametrizado, nunca concatenação de SQL.
- XSS em respostas abertas (exibição e export devem escapar/sanitizar).
- Uploads R2/S3: validar tipo/tamanho, URLs pré-assinadas com expiração curta, nomes sanitizados.
- Logs/auditoria: ações críticas em `audit_logs`; sem senhas/tokens em log.

## Passo 3 — Performance
Aplique `references/performance-patterns.md`. Pontos quentes:
- N+1: relacionamentos buscados em loop → usar `leftJoin`/`inArray`.
- Índices em colunas de `WHERE`/`ORDER BY`/`JOIN` (ex.: `survey_id` em `answers`).
- Cache Redis (`cacheGet`/`cacheSet`) para dados quentes; invalidar após mutação.
- BullMQ com `maxRetriesPerRequest: null` e `enableReadyCheck: false` (Upstash).
- Frontend: `lazyPage()` em rotas; `providesTags`/`invalidatesTags` para evitar over/under-fetch.

## Passo 4 — Estilo e convenções
- Prettier: aspas simples, ponto-e-vírgula, 2 espaços, 100 cols, trailing comma ES5, LF.
- ESLint: `_` em params não usados; sem `any` (exceto `(Redis as any)`); sem `console.log`.
- Camadas `route → controller → service → db` (controller não toca `db`).
- Mensagens de erro em português.
- Frontend: `lazyPage()`, sem `useEffect` para init (usar `key`), shadcn de `@/components/ui`.

## Passo 5 — Saída
Gere relatório estruturado:
- **Resumo** dos principais problemas.
- **Tabela de achados**: arquivo:linha | gravidade | descrição | sugestão.
- **Recomendações finais**: próximos passos e testes sugeridos (E2E).
