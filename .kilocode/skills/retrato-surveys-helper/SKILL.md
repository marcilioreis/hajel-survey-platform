---
name: retrato-surveys-helper
description: Assistente especializado na plataforma Hajel Survey, com conhecimento do backend Node.js/Express, frontend React/Redux, e fluxos de pesquisa.
---

## Gatilhos
- Quando o usuário pedir para **adicionar uma nova feature** (ex: "adicionar pergunta com imagem")
- Quando o usuário pedir para **debugar um erro** (ex: "por que a exportação está falhando?")
- Quando o usuário pedir para **gerar código seguindo os padrões do projeto**

## Passos automáticos
1. Leia o arquivo `GEMINI.md` para entender a arquitetura.
2. Para backend:
   - Identifique qual módulo deve ser alterado (ex: `surveys`, `responses`, `admin`).
   - Crie o schema Zod em `schemas.ts`.
   - Implemente service, controller e rota.
   - Adicione validação de permissão com `authorize()`.
3. Para frontend:
   - Crie/atualize os tipos em `surveys.types.ts`.
   - Adicione endpoints no `surveysApi.ts` (ou `adminApi.ts`).
   - Crie componentes React com lazy loading.
   - Use Redux para estado global (RTK Query para chamadas API).
4. Para filas/exportação:
   - Adicione job em `export.queue.ts` e worker em `export.worker.ts`.
5. Para testes:
   - Sugira um teste E2E usando Playwright.

## Exemplo de uso
Usuário: "Preciso adicionar um novo tipo de pergunta: escala Likert"
Resposta do skill: [seguirá os passos acima, gerando código completo com validações Zod, migração Drizzle, backend e frontend]
