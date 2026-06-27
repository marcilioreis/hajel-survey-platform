# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hajel Survey Platform — a web platform for creating, distributing, and analyzing opinion surveys with RBAC admin panel, conditional question logic, and export features (CSV/PDF/XLSX). The codebase is split into three packages under the repo root: `backend/`, `frontend/`, and `tests/`.

## Development Commands

### Starting services (from repo root)
```bash
# Start just postgres + redis via Docker, then run backend and frontend
npm run e2e:setup

# Or start each separately
npm run dev:backend      # backend on :3000
npm run dev:frontend     # frontend on :5173
docker-compose up -d     # postgres + redis only
```

### Backend (from `backend/`)
```bash
npm run dev              # tsx watch (hot reload)
npm run build            # tsc → dist/
npm run lint             # eslint src/
npm run lint:fix
npm run format           # prettier --write
npm run db:push          # drizzle-kit push (dev schema sync)
npm run db:migrate       # tsx scripts/migrate.ts (apply SQL migrations)
tsx scripts/seed.ts      # seed roles, permissions, admin user
```

### Frontend (from `frontend/`)
```bash
npm run dev              # vite dev server
npm run build            # tsc + vite build + build-sw.js (PWA)
npm run lint
npm run format
npx shadcn@canary add    # add new shadcn/ui components
```

### E2E Tests (from `tests/`)
```bash
npx playwright test                          # all tests
npx playwright test specs/surveys.spec.ts   # single spec
npx playwright test --ui                    # interactive UI mode
```
Tests require backend on :3000 and frontend on :5173 (Playwright starts them automatically via `webServer` config when not already running).

### Database migrations
```bash
# 1. Edit schema in backend/src/shared/db/schema/
# 2. Generate SQL migration
cd backend && npx drizzle-kit generate --name <descriptive-name>
# 3. Review generated file in backend/drizzle/
# 4. Apply
npm run db:migrate
```
**Important**: `surveys_enriched` is a view — always `DROP VIEW IF EXISTS surveys_enriched` before recreating it. Keep the Drizzle schema in sync.

## Architecture

### Backend — modular monolith
```
src/
  modules/           # Feature modules (each has routes, controller, service)
    surveys/         # CRUD, questions, results, reports, export
    responses/       # Public respondent flow
    locations/       # Global location catalog
    geography/       # IBGE/CEP lookup endpoints
    admin/           # Users, roles, audit logs
  shared/
    auth/            # Better Auth config + authenticate middleware
    db/              # Drizzle client (db), schema/index.ts
    middleware/      # loadPermissions, rbac (authorize), validate (validateBody)
    queue/           # BullMQ export.queue.ts + export.worker.ts
    redis/           # ioredis client + cache helpers
    storage/         # Pluggable storage (local or Cloudflare R2)
    validation/      # Zod schemas (schemas.ts)
  graphql/           # Apollo Server (reports)
  app.ts             # Express app configuration
  server.ts          # Entry point (workers, graceful shutdown)
```

**Layer rule**: `route → controller → service → db`. Controllers never import `db` directly.

**RBAC flow**: `loadPermissions` middleware populates `req.userPermissions` (Set) and `req.isAdmin` once per request (Redis-cached 60s). Use `authorize('permission:name')` in routes.

**ES module imports**: always use `.js` extension on relative imports (e.g., `import foo from './foo.js'`).

### Frontend — React SPA
```
src/
  app/               # Redux store + typed hooks (useAppDispatch, useAppSelector)
  features/          # Feature slices (each has *Api.ts RTK Query, *Slice.ts, components)
    auth/            # Login, Register, ProtectedRoute, AdminRoute, authSlice
    surveys/         # Survey CRUD, QuestionEditor, useConditionalLogic
    public-survey/   # Respondent flow (PublicSurveyView, SurveySession)
    reports/         # Charts (Recharts), export button with polling
    locations/       # Location catalog CRUD
    admin/           # User/Role management
    geography/       # State/city/neighborhood API slice
  components/
    common/          # LazyPage, DateTimePicker, ErrorBoundary, Skeleton
    layout/          # AppSidebar, Header, Layout, BottomNav
    ui/              # shadcn/ui components (auto-generated)
  lib/               # api.ts (RTK baseQuery + token refresh), auth.ts, utils.ts
  routes/            # Route definitions (index.tsx, publicRoutes.tsx)
  utils/             # date, mapping, normalizers, text helpers
```

**Page code-splitting**: always wrap pages with `lazyPage()` from `components/common/LazyPage.tsx` — it handles `React.lazy` + `<Suspense>` with skeleton.

**State init pattern**: use `key` prop to force component remount instead of `useEffect` for state initialization.

**Session**: `GET /api/auth/get-session` returns `{ user, session, permissions, roles }`. Permissions and roles are stored in Redux `authSlice` and consumed by `ProtectedRoute`/`AdminRoute`.

## Code Conventions

### Formatting (Prettier)
- Single quotes, semicolons, 2-space indent, 100-char line width, trailing commas (ES5), LF line endings.

### ESLint rules
- Unused parameters must be prefixed with `_` (e.g., `(_req, res) => ...`).
- `any` is forbidden — use `unknown` with type guards. Exception: `(Redis as any)` for ioredis compatibility.
- `console.log` is banned — use `console.info`, `console.warn`, `console.error`.

### Error messages
Backend errors are in Portuguese: `'Pesquisa não encontrada'`, `'Acesso negado'`.

### Commit format
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` — e.g., `feat(backend): add conditional logic to questions`

## Key Business Rules

- **Survey status** is computed by the `surveys_enriched` view (not stored): `encerrada` (end_date past) → `inativa` (active=false) → `rascunho` (active=true, future start) → `ativa`.
- **Conditional logic** on questions uses `useConditionalLogic.ts` on the frontend; rules are stored as JSON in `questions.conditional_logic`.
- **Export jobs** run via BullMQ (`export.queue.ts` / `export.worker.ts`). The frontend polls `GET /api/exports/:id/status` until complete, then auto-downloads.
- **Location association**: send `locations: [{id, order?}]` or `locationIds`; backend uses `setSurveyLocations` which replaces the full list.

## Known Issues & Workarounds

- **Upstash Redis + BullMQ**: always use BullMQ (never the original Bull). Required ioredis options: `maxRetriesPerRequest: null`, `enableReadyCheck: false`, `tls: { rejectUnauthorized: false }`, `family: 0`.
- **Cross-site cookies on Render**: `.onrender.com` is on the Public Suffix List — `SameSite=None` cookies are blocked. Use Bearer token auth (plugin already active).
- **Frontend MIME type on Render Static Site**: direct route access may serve CSS as `text/plain`. The `index.html` has a reload workaround script; the long-term fix is to serve via an Express web service.

## Infrastructure

- **Local dev**: PostgreSQL + Redis via Docker Compose (`docker-compose.yml` at repo root).
- **Production**: Render (backend web service + frontend static site), Cloudflare R2 (file storage), Upstash Redis.
- **Backend port**: 3000. **Frontend port**: 5173. **Health check**: `GET /health`.
- **API docs (Swagger)**: `http://localhost:3000/api-docs`.
- **GraphQL**: `http://localhost:3000/graphql`.

## Claude Code Setup (.claude/)

Este repo inclui um setup de Claude Code em `.claude/`:

- **Skills** (`.claude/skills/`): `hajel-feature-builder` (feature ponta a ponta),
  `deep-review` (revisão profunda com checklists), `fix-redis-connection`,
  `drizzle-migrations`, `rbac-endpoint`. Carregam automaticamente quando relevantes.
- **Subagents** (`.claude/agents/`): `code-reviewer` (revisão rápida de diff, proativo),
  `db-migrator` (schema/migrations), `e2e-runner` (Playwright). Invoque com
  "use o subagent X" ou deixe o Claude delegar.
- **Slash commands** (`.claude/commands/`): `/review`, `/new-feature`,
  `/generate-migration`, `/run-e2e`, `/codebase`, `/commit`.
- **settings.json**: permissões de ferramentas e bloqueio de leitura de segredos
  (`.env`, chaves, `exports/`, `backups/`, `fixtures/pii/`).

Consulte `.claude/README.md` para detalhes de instalação e uso.
