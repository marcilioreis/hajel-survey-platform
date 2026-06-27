---
name: rbac-endpoint
description: >-
  Use ao proteger um endpoint com RBAC no Hajel, criar uma permissão nova,
  depurar 401/403, ou entender como permissões e roles fluem do banco até
  req.userPermissions. Cobre loadPermissions, authorize, o atalho req.isAdmin,
  o cache Redis de 60s e a invalidação necessária após mudar permissões.
---

# RBAC — proteger endpoints e gerenciar permissões

Arquivos-chave:
- `backend/src/shared/middleware/loadPermissions.ts` — carrega permissões por request.
- `backend/src/shared/middleware/rbac.ts` — `authorize`, `hasPermission`, `hasPermissions`.
- Schema em `backend/src/shared/db/schema/rbac.ts`.
- Seed de roles/permissões em `backend/scripts/seed.ts`.

## Como o fluxo funciona
1. `authenticate` (Better Auth, plugin `bearer` ativo) identifica `req.user`.
2. `loadPermissions` roda **uma vez por request**: monta `req.userPermissions` (Set de
   códigos, direto de `user_permissions` + herdadas via `user_roles`→`role_permissions`)
   e `req.isAdmin` (true se `user.role === 'admin'`). Usa cache Redis
   `permissions:${userId}` com TTL **60s**.
3. `authorize(required)` checa o Set. Aceita:
   - string: `authorize('survey:create')`
   - array (modo `all`): `authorize(['survey:create','survey:edit_any'])`
   - objeto: `authorize({ any: ['a','b'] })` ou `authorize({ all: ['a','b'] })`
   - `req.isAdmin === true` **passa direto** (atalho de admin).

## Proteger uma rota
Na ordem dos middlewares na rota:
```ts
router.post(
  '/',
  authorize('survey:create'),       // RBAC
  validateBody(createSurveySchema), // validação
  controller.createSurvey
);
```
`authenticate` + `loadPermissions` já são aplicados globalmente no `app.ts` antes dos
routers autenticados — confirme que a rota está sob esse pipeline (não nas rotas públicas `/s/...`).

## Criar uma permissão nova
1. Adicione o código (ex.: `survey:archive`) ao seed em `scripts/seed.ts`, vinculando às
   roles apropriadas.
2. Rode `tsx scripts/seed.ts` para popular.
3. Use `authorize('survey:archive')` na rota.

## Invalidação de cache (bug comum de staleness)
Qualquer mutação que altere roles/permissões de um usuário **deve** invalidar o cache:
```ts
await redis.del(`permissions:${userId}`);
```
Sem isso, o usuário continua com o conjunto antigo por até 60s. Verifique isso em
`admin.service.ts` ao atribuir/remover roles ou permissões diretas.

## Depurar 401/403
- **401**: sem `req.user` → token Bearer ausente/expirado. No frontend, confira
  `auth-token` no storage e o refresh em `lib/api.ts`. Lembre que `.onrender.com` bloqueia
  cookies `SameSite=None` — o projeto usa Bearer.
- **403**: autenticado mas sem a permissão. Confira o código exato em `authorize`, se a
  permissão está no seed e vinculada à role do usuário, e se o cache não está stale
  (force `redis.del` e teste de novo).
