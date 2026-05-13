# Executar testes E2E

1. Certifique-se de que os containers Docker (Postgres, Redis) estão rodando: `docker-compose up -d postgres redis`.
2. Execute `npm run e2e:setup` (ou os passos manuais: migrate, seed, start backend/frontend).
3. Navegue até `tests/` e execute `npx playwright test`.
4. Se falhar, analise os logs e sugira correções baseadas no `GEMINI.md` (ex: configuração de Redis, MIME types).