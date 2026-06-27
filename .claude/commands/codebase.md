---
description: Relatório breve das tecnologias e arquitetura do projeto
allowed-tools: Read, Grep, Glob, Bash(cat:*), Bash(ls:*)
---

Verifique a base do código e traga um relatório breve com as tecnologias usadas no projeto.

Contexto:
- Consulte `CLAUDE.md` na raiz para a visão arquitetural.
- Consulte as convenções em `.claude/skills/` (especialmente `hajel-feature-builder`).
- Confirme as versões reais lendo `backend/package.json`, `frontend/package.json` e
  `tests/package.json` — não confie só na documentação, que pode estar desatualizada.

Entregue:
1. Stack por camada (backend / frontend / infra / testes) com versões reais.
2. Resumo da arquitetura (monólito modular backend, SPA frontend, camadas, RBAC, filas).
3. Pontos de atenção conhecidos (Redis/Upstash, view surveys_enriched, MIME no Render).
Seja conciso — bullets e uma tabela, sem encher linguiça.
