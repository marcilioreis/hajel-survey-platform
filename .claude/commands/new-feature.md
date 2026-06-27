---
description: Implementa uma feature de ponta a ponta seguindo os padrões do Hajel
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npm run lint*), Bash(npm run format*), Bash(cd backend*), Bash(cd frontend*)
argument-hint: "<descrição da feature, ex: adicionar tipo de pergunta escala Likert>"
---

Implemente esta feature no Hajel Survey, de ponta a ponta: $ARGUMENTS

Use a skill `hajel-feature-builder` como guia. Antes de codar, faça um plano curto
(módulos afetados, se precisa de migration/permissão/fila) e confirme comigo se houver
ambiguidade relevante.

Ordem esperada:
1. **Backend**: schema Zod → service (única camada com `db`) → controller → route com
   `authorize()` + `validateBody()` + doc `@openapi`.
2. Se precisar de **migration**: use a skill `drizzle-migrations` (cuidado com a view).
3. Se precisar de **permissão nova**: semeie em `scripts/seed.ts` e proteja a rota.
4. Se precisar de **fila** (export/trabalho pesado): produtor em `export.queue.ts`,
   processamento em `export.worker.ts`, reutilizando a conexão Redis.
5. **Frontend**: tipos → API slice (RTK Query, tags corretas) → componentes (shadcn,
   sem `any`) → página com `lazyPage()` → registrar rota com `ProtectedRoute`/`AdminRoute`.

Respeite as convenções: imports `.js` no backend, sem `any`/`console.log`, mensagens de
erro em português, sem `useEffect` para init no frontend.

Ao final: rode `npm run lint` e `npm run format` nos pacotes afetados, sugira um teste E2E
e proponha uma mensagem de commit convencional (`feat(...)`).
