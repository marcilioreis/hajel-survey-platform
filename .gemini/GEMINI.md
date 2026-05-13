# Hajel Survey Platform – GEMINI.md

## Visão Geral
Plataforma web para criação, distribuição e análise de pesquisas de opinião.  
Pesquisadores podem criar questionários (com ou sem lógica condicional), compartilhar via link público ou aplicar presencialmente, e visualizar resultados em gráficos.  
Inclui painel administrativo com gerenciamento de usuários, papéis e permissões (RBAC).

A plataforma é composta por:
- **Backend**: monolítico modular em Node.js/Express + TypeScript
- **Frontend**: SPA mobile‑first em React + Redux Toolkit + Vite

---

## Stack Tecnológica

| Camada      | Tecnologias                                                                                                                                  |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| **Backend** | Node.js (v20), Express 5.2.1, TypeScript estrito, Drizzle ORM, PostgreSQL, BullMQ (fila), Redis, Zod 4.3.6, Better Auth 1.6.5                |
| **Frontend**| React 19, Vite 8, TypeScript 6, Tailwind CSS 4, shadcn/ui (Radix UI), Redux Toolkit + RTK Query, React Router 7, Recharts, Better Auth 1.6.5 |
| **Infra**   | Render (web service + static site), Cloudflare R2 (storage), Upstash Redis (compatível com BullMQ), AWS SDK S3                               |

> ✅ **Nota sobre filas**: O backend utiliza **BullMQ** (substituiu o Bull original devido a incompatibilidades com Upstash Redis). O frontend não interage diretamente com filas; apenas consome os endpoints de exportação.

---

## Arquitetura e Estrutura de Pastas

### Backend (monolítico modular)
backend/
├── src/
│ ├── modules/
│ │ ├── auth/ # autenticação (Better Auth)
│ │ ├── surveys/ # CRUD de pesquisas, perguntas, resultados, relatórios
│ │ ├── responses/ # fluxo de respostas públicas/autenticadas
│ │ ├── locations/ # catálogo global de locais
│ │ ├── geography/ # endpoints de geografia (IBGE, CEP, bairros)
│ │ └── admin/ # painel administrativo (usuários, roles, auditoria)
│ ├── shared/
│ │ ├── db/ # schemas Drizzle, views, tipos
│ │ ├── middleware/ # auth, rbac, loadPermissions, validate, rate-limiters
│ │ ├── redis/ # cliente ioredis, cache
│ │ ├── queue/ # fila BullMQ (export.queue.ts, export.worker.ts)
│ │ ├── storage/ # storage plugável (local/R2)
│ │ ├── email/ # transport Nodemailer
│ │ ├── types/ # extensões de tipos (Express, Better Auth)
│ │ └── validation/ # schemas Zod
│ ├── graphql/ # Apollo Server (relatórios)
│ ├── docs/ # configuração Swagger
│ ├── app.ts # configuração principal do Express
│ └── server.ts # ponto de entrada (workers, graceful shutdown)
├── scripts/ # seed.ts, import-neighborhoods.ts
├── drizzle/ # migrações SQL
├── drizzle.config.ts
└── .env


### Frontend (SPA com Vite)
frontend/
├── public/ # Ícones PWA, manifest.json
├── src/
│ ├── app/ # Store Redux, hooks tipados
│ ├── components/
│ │ ├── common/ # DateTimePicker, ErrorBoundary, LazyPage
│ │ ├── layout/ # AppSidebar, Header, Layout
│ │ └── ui/ # Componentes shadcn/ui (auto‑gerados)
│ ├── features/
│ │ ├── admin/ # Dashboard, User/Role CRUD (AdminRoute)
│ │ ├── auth/ # Login, Register, Profile, recuperação de senha
│ │ ├── geography/ # APIs de apoio (estados, municípios, CEP)
│ │ ├── locations/ # Catálogo global de locais (CRUD)
│ │ ├── public-survey/ # Fluxo público do respondente
│ │ ├── reports/ # Gráficos de resultados + exportação (CSV/PDF/XLSX)
│ │ └── surveys/ # CRUD de pesquisas com editor de perguntas e lógica condicional
│ ├── lib/ # api.ts (interceptador), auth.ts, errorMiddleware, utils
│ ├── routes/ # Definição de rotas (públicas + protegidas)
│ └── utils/ # date, mapping, normalizers, text
└── index.html


---

## Padrões de Código

### Backend
- **Imports**: sempre usar extensão `.js` em imports relativos (ES modules com `moduleResolution: NodeNext`).
- **Tipagem**: `strict: true`. Evitar `any`; usar `unknown` com type guards.  
  Exceção: `(Redis as any)` para compatibilidade com ioredis.
- **Camadas**: `routes → controller → service → db (Drizzle)`.  
  Controllers nunca acessam `db` diretamente; serviços são responsáveis pelas queries.
- **Validação**: Zod schemas definidos em `schemas.ts` e aplicados via middleware `validateBody`.
- **Erros**: padronizar em português (`'Pesquisa não encontrada'`, `'Acesso negado'`).
- **RBAC**: permissões carregadas uma vez por request no middleware `loadPermissions`, armazenadas em `req.userPermissions` (Set) e `req.isAdmin`. Middleware `authorize` verifica essas permissões.  
  Cache Redis (opcional) com TTL de 60s evita consultas repetidas ao banco.

### Frontend
- **TypeScript rigoroso**: `any` é proibido; tipagem explícita em todos os componentes e funções.
- **shadcn/ui**: componentes usados para botões, inputs, cards, tabelas, diálogos etc.; instalados via `npx shadcn@canary add`.
- **Lazy loading**: páginas carregadas com `lazyPage()` (envolve `React.lazy` + `<Suspense>` com skeletons).
- **Formulários**: wrappers com `key` para forçar remontagem, evitando `useEffect` para inicialização de estado.
- **Estilização**: Tailwind CSS 4 com variáveis CSS; `cva` para variantes de componentes.
- **Gerenciamento de estado**: Redux Toolkit + RTK Query com interceptador para renovação automática de token.

---

## Modelo de Dados (Principais Tabelas no Backend)
- `user`, `session`, `account`, `verification` (Better Auth)
- `surveys`, `questions`, `location_catalog`, `survey_locations`, `neighborhoods`
- `response_sessions`, `respondents`, `answers`
- `roles`, `permissions`, `user_roles`, `role_permissions`, `user_permissions`
- `audit_logs`, `exported_reports`, `webhooks`
- **View**: `surveys_enriched` retorna perguntas, locais associados, contagem de respostas e status calculado.

---

## Regras de Negócio Importantes
- **Status da pesquisa** (calculado pela view `surveys_enriched`):
  - `encerrada`: se `end_date < CURRENT_TIMESTAMP`
  - `inativa`: se `active = false`
  - `rascunho`: se `active = true`, `start_date` futuro, `end_date` não expirado
  - `ativa`: demais casos com `active = true`
- **Associação de locais**: frontend envia `locations: [{id, order?}]` ou `locationIds`; backend usa `setSurveyLocations` para substituir lista.
- **Respostas autenticadas**: finalizam a sessão automaticamente (`finalizeUserSession`).
- **Exportação**: jobs em BullMQ; suporte a CSV, JSON, PDF, XLSX; storage local ou R2.

---

## Autenticação e Autorização (Backend + Frontend)
- **Backend**: Better Auth configurado em `src/shared/auth/auth.ts`.  
  Plugin `bearer()` ativo para tokens.  
  Rota personalizada `GET /api/auth/get-session` retorna `{ user, session, permissions, roles }`.  
  Seed (`scripts/seed.ts`) popula roles e permissões; aceita email para definir admin.
- **Frontend**:  
  `ProtectedRoute` e `AdminRoute` verificam permissões e papéis vindos da sessão.  
  Permissões armazenadas no Redux (`permissions`, `roles`).  
  Interceptador RTK Query renova token automaticamente.

---

## Endpoints Principais (Backend)
- **Auth**: `/api/auth/*` (handler do Better Auth)
- **Surveys**: `POST/GET/PUT/DELETE /api/surveys`, `GET /api/surveys/:id`
- **Questions**: `/api/surveys/:id/questions`, batch: `POST /batch`
- **Responses públicas**: `/s/:slug`, `/s/:token/answers`, `/s/:token/complete`
- **Responses autenticadas**: `POST /api/surveys/:id/responses`
- **Results**: `GET /api/surveys/:id/results`, `GET /api/surveys/:id/open-ended-responses`
- **Exports**: `POST /api/surveys/:id/exports`, `GET /api/exports/:id/status`, `GET /api/exports/:id/download`
- **Locations**: `GET/POST /api/locations`, `PUT/DELETE /api/locations/:id`
- **Geography**: `/api/geography/states`, `/municipalities/:uf`, `/neighborhoods/:city`, `/cep/:cep`
- **Admin**: `GET/POST /api/admin/users`, `GET/PUT /api/admin/users/:id`, `GET/POST /api/admin/roles`, `GET /api/admin/permissions`, `GET /api/admin/audit-logs`
- **GraphQL**: `/graphql`
- **Swagger**: `/api-docs`

---

## Funcionalidades Chave no Frontend

### Pesquisas (CRUD)
- Editor dinâmico de perguntas (`QuestionEditor`).
- Adição/remoção de opções.
- **Lógica condicional** (opcional): configurável por pergunta, com ações "skip" ou "show" e operadores `equals`, `not_equals`, `contains`, `not_contains`.  
- Hook `useConditionalLogic.ts` processa regras no frontend; regras armazenadas como JSON no campo `conditional_logic` da pergunta.

### Relatórios
- Gráficos de barras coloridos dinamicamente (Recharts).
- Listagem de respostas abertas.
- Exportação (CSV/PDF/XLSX) com polling e download automático.

### Localizações
- Catálogo global com seletores encadeados: estado → município → bairro (busca CEP opcional).

### PWA
- Service worker gerado com `workbox-build` (script `build-sw.js`).

---

## Problemas Conhecidos e Workarounds

### Backend
- **Cookie cross‑site (onrender.com)**: domínios `.onrender.com` estão na Public Suffix List, bloqueando `SameSite=None`.  
  **Solução**: usar token Bearer (plugin `bearer` já ativo) ou domínio personalizado.
- **Redis com Upstash**: nunca usar Bull original; usar BullMQ com configuração específica:
  ```js
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: { rejectUnauthorized: false },
  family: 0
- **View survey_enriched**: ao alterar, deve-se dropar antes de recriar. Manter schema Drizzle sincronizado.
- **Importação de neighborhoods**: CSV com `location_name` e `type`; constraint única `(state, city, neighborhood, type)`.

---

### Frontend + Deploy

1. **MIME type incorreto no Render (Static Site)**
   - Ao acessar rotas como `/login` diretamente, o CSS pode ser servido como `text/plain`. 
   - **Solução paliativa:** script no `index.html` que recarrega a página via `index.html` quando o CSS falha.
   - **Recomendação futura:** migrar o frontend para um Web Service (Express) no Render, servindo a pasta `dist` com `express.static` e cabeçalhos MIME corretos.

2. **Erro “unsupported MIME type ('text/html')”**
   - Causado por `<link href="/src/style.css">` no `index.html` (arquivo inexistente). Basta remover essa tag – o Vite importa CSS via JS.

3. **Conflito de mutations RTK Query**
   - `authApi` e `adminApi` tinham endpoints com mesmo nome (`updateUser`). Resolvido renomeando a mutation no `authApi` para `updateProfile`.

4. **Refresh quebra a sessão**
   - `ProtectedRoute` despachava `setLoading(false)` antes da query `getCurrentUser` concluir, redirecionando para `/login`. Corrigido usando o estado `isLoading` da própria query.

---

## Variáveis de Ambiente Importantes
- `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- `FRONTEND_URL`, `NODE_ENV`
- `STORAGE_DRIVER`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_PORT`, `STORAGE_USE_SSL`
- `SMTP_*` (para reset de senha)

---

## 🚀 Próximas Fases (Sugestões)
- **Testes E2E**: implementar cenários com Playwright (login, criação de pesquisa, execução pública, visualização de relatórios).
- **Internacionalização**: preparar o frontend com `react-i18next`.
- **Sanitização de respostas abertas**: prevenir XSS em textos exportados.
- **Dashboard**: adicionar indicadores como taxa de conclusão (adiado).