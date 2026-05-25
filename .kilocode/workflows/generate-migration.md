# Gerar migration Drizzle

1. Verifique os schemas alterados em `backend/src/shared/db/schema/`.
2. Execute `cd backend && npx drizzle-kit generate --name <nome-descritivo>`.
3. Revise o arquivo SQL gerado em `backend/drizzle/`.
4. Se for uma view, forneça o comando para recriá-la (ex: `DROP VIEW IF EXISTS ...`).
5. Oriente o usuário a aplicar a migration com `npm run db:migrate` (ou `tsx scripts/migrate.ts`).
