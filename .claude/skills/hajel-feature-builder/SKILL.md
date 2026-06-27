---
name: hajel-feature-builder
description: >-
  Use ao adicionar uma feature de ponta a ponta no Hajel Survey (ex.: novo tipo
  de pergunta, novo endpoint de relatório, novo recurso de admin) ou ao gerar
  código que precise seguir os padrões do projeto. Cobre a ordem correta das
  camadas no backend (Zod → service → controller → route → RBAC), o padrão de
  feature slice no frontend (RTK Query + lazyPage), filas BullMQ e migrations.
  Não use para fixes pontuais sem nova superfície de API.
---

# Hajel Feature Builder

Guia para implementar uma feature completa respeitando a arquitetura do Hajel.
Leia o `CLAUDE.md` da raiz para contexto arquitetural antes de começar.

## Antes de codar
1. Identifique o módulo backend afetado: `surveys`, `responses`, `locations`,
   `geography`, `admin`. Identifique a feature frontend correspondente em
   `frontend/src/features/`.
2. Decida se a feature precisa de: migration (mudança de schema), permissão RBAC
   nova, job de fila (export/processamento pesado), endpoint GraphQL (relatórios).

## Backend — ordem das camadas (route → controller → service → db)
Implemente nesta sequência:

1. **Schema Zod** em `backend/src/shared/validation/schemas.ts`. Exporte o schema
   e o tipo inferido. Mensagens em português.
2. **Service** em `src/modules/<modulo>/<modulo>.service.ts`. É a **única** camada que
   toca o `db` (Drizzle). Toda query vive aqui. Lance erros com mensagem em português.
3. **Controller** em `<modulo>.controller.ts`. Recebe `req/res`, chama o service,
   formata a resposta e os status codes. **Nunca importa `db` nem monta query.**
4. **Route** em `<modulo>.routes.ts`. Monta a rota com middlewares na ordem:
   `authorize('permissao:code')` → `validateBody(schema)` → `controller.handler`.
   Adicione o bloco de doc `@openapi` (Swagger) como nas rotas existentes.

Regras inegociáveis: imports relativos terminam em `.js`; sem `any`
(use `unknown` + type guard); sem `console.log`; params não usados com `_`.

Veja `references/backend-feature.md` para um esqueleto copiável das 4 camadas.

## RBAC
Se a feature precisa de permissão nova, ela é semeada em `scripts/seed.ts`
(roles/permissions). Proteja a rota com `authorize('recurso:acao')`
(ex.: `survey:create`, `survey:edit_any`, `location:create`). Lembre que `req.isAdmin`
passa direto. Permissões são carregadas por `loadPermissions` (cache Redis 60s);
qualquer mutação que altere permissões de um usuário deve invalidar
`permissions:${userId}` no Redis.

## Filas (BullMQ) — só para trabalho pesado/assíncrono
Ex.: exportações. Adicione o produtor em `shared/queue/export.queue.ts` e o
processamento em `export.worker.ts`. Reutilize a instância Redis compartilhada
(nunca crie conexão padrão). Job deve ter timeout e atualizar status em falha.
O frontend faz polling em `GET /api/exports/:id/status` (máx 2s, limite de tentativas)
e baixa ao concluir.

## Frontend — feature slice
Em `frontend/src/features/<feature>/`:
1. **Tipos** em `<feature>.types.ts`.
2. **API slice** em `<feature>Api.ts` com RTK Query (`injectEndpoints` sobre o `api`
   base de `lib/api.ts`). Defina `providesTags`/`invalidatesTags` usando as tags já
   registradas (`Survey`, `Response`, `Report`, `Location`, `AdminUser`, `AdminRole`).
   Nunca duplique nome de endpoint entre `authApi` e `adminApi`.
3. **Componentes** funcionais, props tipadas, shadcn de `@/components/ui/...`.
   Estilo via Tailwind + `cn()`. Sem `any`.
4. **Páginas** sempre via `lazyPage()` (de `components/common/LazyPage.tsx`).
5. **Init de estado**: use prop `key` para remontar; evite `useEffect` para inicializar.
6. Registre a rota em `src/routes/index.tsx` (ou `publicRoutes.tsx` se pública),
   protegendo com `ProtectedRoute`/`AdminRoute` conforme o caso.

Veja `references/frontend-feature.md` para o esqueleto do slice e componente.

## Migration
Se mudou schema, use a skill `drizzle-migrations` (gerar, revisar, aplicar; cuidado
com a view `surveys_enriched`).

## Fechamento
- Rode lint/format: `npm run lint` e `npm run format` (em backend e/ou frontend).
- Sugira/escreva um teste E2E (Playwright) cobrindo o caminho feliz e um erro.
- Commit no formato convencional: `feat(backend): ...` / `feat(frontend): ...`.
