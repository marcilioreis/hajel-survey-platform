# Checklist de Segurança

## Validação e sanitização
- [ ] Todas as entradas do usuário são validadas com Zod (ou equivalente).
- [ ] Dados de saída são escapados para evitar XSS (especialmente em respostas abertas).
- [ ] Parâmetros de rota e query são tipados e validados.

## Autenticação e autorização
- [ ] Rotas sensíveis usam `authenticate` e `loadPermissions`.
- [ ] Permissões específicas são verificadas com `authorize()`.
- [ ] Admin não tem permissões implícitas sensíveis (apenas via RBAC).

## Injeção de código
- [ ] Consultas ao banco usam Drizzle ORM (parametrizadas) – não concatenam strings SQL.
- [ ] Comandos shell não são executados com dados do usuário.

## Filas e jobs (BullMQ)
- [ ] Dados sensíveis não são logados no worker.
- [ ] Jobs têm timeout e tratam falhas (atualizam status `falha`).
- [ ] Conexão Redis usa TLS quando em produção (Upstash).

## Uploads e armazenamento (R2/S3)
- [ ] Arquivos são validados por tipo e tamanho.
- [ ] URLs pré-assinadas têm expiração curta (máximo 1 hora).
- [ ] Nomes de arquivos são sanitizados (evitar path traversal).

## Logs e auditoria
- [ ] Ações críticas (criação/edição/exclusão de pesquisa, alteração de permissões) são registradas em `audit_logs`.
- [ ] Logs não contêm senhas ou tokens.