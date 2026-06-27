---
name: drizzle-migrations
description: >-
  Use ao gerar, revisar ou aplicar migrations Drizzle/Postgres no Hajel, ou ao
  alterar schemas em backend/src/shared/db/schema/. Cobre a pegadinha da view
  surveys_enriched (precisa de DROP VIEW antes de recriar), índices, constraints
  e o fluxo generate → revisar SQL → migrate.
---

# Migrations Drizzle

Schemas em `backend/src/shared/db/schema/` (`surveys.ts`, `rbac.ts`, `responses.ts`,
`locations.ts`, `audit.ts`, `reports.ts`, `webhooks.ts`, `views.types.ts`).
Migrations SQL versionadas em `backend/drizzle/`.

## Fluxo
1. Edite o schema Drizzle relevante.
2. Gere o SQL:
   ```bash
   cd backend && npx drizzle-kit generate --name <nome-descritivo>
   ```
3. **Revise** o arquivo gerado em `backend/drizzle/`: tipos, defaults, nullability,
   índices, constraints únicas. Drizzle nem sempre cria índices — adicione em colunas de
   `WHERE`/`ORDER BY`/`JOIN` (ex.: `survey_id` em `answers`).
4. Aplique:
   ```bash
   npm run db:migrate     # tsx scripts/migrate.ts
   ```
   (`npm run db:push` existe para sync rápido em dev, mas use generate+migrate para histórico.)

## View surveys_enriched (crítico)
Calcula o status da pesquisa (não armazenado): `encerrada` → `inativa` → `rascunho` → `ativa`.
Ao alterar a view, a migration deve **dropar antes de recriar**:
```sql
DROP VIEW IF EXISTS surveys_enriched;
CREATE VIEW surveys_enriched AS ...;
```
Exemplos no repo: `0001_create_surveys_enriched_view.sql`, `0003_update_surveys_enriched_view.sql`,
`0005`/`0006_create_surveys_enriched_view.sql`. Mantenha `views.types.ts` sincronizado com
as colunas retornadas.

## Convenções de dados conhecidas
- `neighborhoods`/`city` migraram para **JSONB** (migrations 0007/0008/0009) — respeite o formato.
- Constraint única de bairros: `(state, city, neighborhood, type)`.
- `questions.conditional_logic`: JSON com regras (`skip`/`show`, operadores `equals`,
  `not_equals`, `contains`, `not_contains`).
- Tabelas Better Auth (`user`, `session`, `account`, `verification`): gerenciadas pelo
  adapter — não altere à mão.

## Importação de bairros
Script `scripts/import-neighborhoods.ts`: CSV com `location_name` e `type`, respeitando a
constraint única.

## Rollback
Mudanças destrutivas (drop de coluna/tabela) precisam de plano de rollback. Há
`scripts/rollback_migration.sql` como referência. Avise o usuário antes de aplicar algo destrutivo.
