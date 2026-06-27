---
description: Revisão de código focada em bugs, segurança e convenções do Hajel
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Read, Grep, Glob
argument-hint: "[arquivo | commit | vazio p/ mudanças não commitadas]"
---

Faça uma revisão de código como engenheiro sênior do Hajel Survey.

Escopo: $ARGUMENTS
Se o escopo estiver vazio, revise as mudanças não commitadas (`git diff HEAD` e
`git diff --staged`). Se for um arquivo, foque nele lendo os vizinhos para contexto.
Se parecer um commit/PR, lembre que ele pode não estar com checkout — confira o estado local.

Encontre **todos** os potenciais bugs e melhorias. Foque em:
1. Erros de lógica e comportamento incorreto
2. Edge cases não tratados
3. Null/undefined
4. Condições de corrida / concorrência (workers BullMQ, polling de export)
5. Vulnerabilidades de segurança
6. Vazamento de recursos (conexões, streams, timers)
7. Violação de contrato de API
8. Caching incorreto (chave, invalidação, staleness, cache inútil)
9. Violação de padrões/convenções do projeto

Critérios específicos do Hajel:
- Mensagens de erro em **português**.
- Permissões RBAC validadas com `authorize()`; mutação de permissão invalida `permissions:${userId}`.
- Camadas respeitadas: controller → service → db (controller não toca `db`).
- Redis com `family:0` e `tls` para Upstash; BullMQ reutiliza a conexão.
- Sem `any` (exceto `(Redis as any)`); sem `console.log`; imports relativos com `.js`.
- Frontend: `lazyPage()`, sem `useEffect` para init, shadcn de `@/components/ui`,
  tags RTK Query corretas.

Regras: explore em paralelo, não demore demais. Reporte também bugs pré-existentes.
Não reporte achados especulativos ou de baixa confiança.

Saída agrupada por severidade (🔴 Crítico / 🟡 Importante / 🔵 Sugestão), cada achado com
`arquivo:linha`, descrição e correção sugerida. Termine com veredito de uma linha.
