---
description: Gera uma migration Drizzle seguindo o fluxo e a regra da view do Hajel
allowed-tools: Read, Grep, Glob, Edit, Bash(cd backend*), Bash(npx drizzle-kit:*), Bash(npm run db:migrate), Bash(git diff:*)
argument-hint: "<nome-descritivo-da-migration>"
---

Gere uma migration Drizzle para o Hajel. Nome sugerido: $ARGUMENTS

Siga este fluxo:
1. Verifique os schemas alterados em `backend/src/shared/db/schema/`. Se eu ainda não
   alterei o schema, pergunte qual mudança quero ou implemente a mudança que descrevi.
2. Gere: `cd backend && npx drizzle-kit generate --name $ARGUMENTS`.
3. **Revise** o arquivo SQL gerado em `backend/drizzle/`: tipos, defaults, nullability,
   índices (adicione em colunas de WHERE/ORDER BY/JOIN) e constraints únicas.
4. Se a mudança envolver a view `surveys_enriched`, garanta que a migration faça
   `DROP VIEW IF EXISTS surveys_enriched;` antes de `CREATE VIEW ...`, e atualize
   `views.types.ts`.
5. Me oriente a aplicar: `npm run db:migrate` (ou `tsx scripts/migrate.ts`). Avise se a
   mudança for destrutiva (drop) e ofereça um plano de rollback.

Para detalhes use a skill `drizzle-migrations`. Comentários SQL podem ficar em português.
