---
name: hajel-core-conventions
description: Regras essenciais de codificação, formatação e arquitetura para a plataforma Hajel Survey
trigger: always_on
---

# Hajel Core Conventions

## 1. Formatação (Prettier)
- Ponto e vírgula obrigatório (`semi: true`)
- Aspas simples (`singleQuote: true`)
- Indentação de 2 espaços (`tabWidth: 2`)
- Vírgula final em objetos/arrays multi-linha (`trailingComma: es5`)
- Máximo de 100 caracteres por linha (`printWidth: 100`)
- Fim de linha LF (`endOfLine: lf`)

## 2. ESLint (obrigatório)
- Parâmetros não utilizados DEVEM começar com `_` (ex: `(_req, res)`)
- Evite `any`; prefira `unknown` com type guards. `any` apenas com justificativa.
- `console.log` proibido em produção. Use `console.info`, `console.warn`, `console.error`.
- Sempre tipar parâmetros de callback.

## 3. Estrutura de código

### Backend (Node/Express/TypeScript)
- Camadas: `route → controller → service → db`. Controllers não acessam DB diretamente.
- Mensagens de erro em português (ex: "Pesquisa não encontrada").
- Módulos em `src/modules/`, schemas DB em `src/shared/db/schema/`, validações Zod em `src/shared/validation/schemas.ts`.

### Frontend (React/TypeScript)
- Componentes funcionais com props tipadas.
- Use `lazyPage()` para code-splitting (componente wrapper com Suspense e skeleton).
- Evite `useEffect` para inicialização de estado; prefira `key` para forçar remontagem.
- Nomes: `PascalCase` para componentes, `camelCase` para utilitários.
- Diretórios: features em `src/features/` (cada feature tem API slice, componentes, types); componentes reutilizáveis em `src/components/ui/`.

## 4. Endpoints e jobs comuns
- Criar pergunta: `POST /api/surveys/{surveyId}/questions`
- Exportar resultados: `POST /api/surveys/{surveyId}/exports` (fila BullMQ)
- Criar local: `POST /api/locations` (requer permissão `survey:edit_any`)
- Gerenciar permissões: via `/api/admin/users` e `/api/admin/roles`

## 5. Convenções de commit
- Prefixos: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Exemplo: `feat(backend): add conditional logic to questions`

## 6. Testes
- E2E com Playwright (`tests/`)
- Antes do PR: `npm run e2e:setup` ou `npx playwright test`

## 7. Comandos úteis
- Lint: `npm run lint` (backend ou frontend)
- Formatar: `npm run format` (ou `npx prettier --write .`)
- Fix automático: `npm run lint:fix`

## 8. Contexto permanente
- Consulte `.gemini/GEMINI.md` para arquitetura completa e problemas conhecidos.
- Use `@.gemini/GEMINI.md` para referenciar esse documento.
