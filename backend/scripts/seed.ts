// scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // carrega DATABASE_URL e outras variáveis

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../src/shared/auth/auth';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Permissões básicas
  const permissionData = [
    { code: 'survey:create', description: 'Criar pesquisas' },
    { code: 'survey:edit', description: 'Editar pesquisas próprias' },
    { code: 'survey:edit_any', description: 'Editar qualquer pesquisa' },
    { code: 'survey:delete', description: 'Excluir pesquisas próprias' },
    { code: 'survey:delete_any', description: 'Excluir qualquer pesquisa' },
    { code: 'survey:view', description: 'Visualizar pesquisas próprias' },
    { code: 'survey:view_any', description: 'Visualizar qualquer pesquisa' },
    { code: 'response:view_aggregated', description: 'Ver resultados agregados' },
    { code: 'response:view_individual', description: 'Ver respostas individuais' },
    { code: 'report:export', description: 'Exportar relatórios' },
    { code: 'user:manage', description: 'Gerenciar usuários' },
    { code: 'role:manage', description: 'Gerenciar papéis e permissões' },
    { code: 'audit:view', description: 'Visualizar logs de auditoria' },
  ];

  console.log('📌 Inserindo permissões...');
  const insertedPermissions = await db
    .insert(schema.permissions)
    .values(permissionData)
    .onConflictDoNothing({ target: schema.permissions.code })
    .returning();

  // 2. Papéis
  const roleData = [
    { name: 'admin', description: 'Administrador do sistema – acesso total' },
    { name: 'researcher', description: 'Pesquisador – pode criar e gerenciar suas pesquisas' },
    { name: 'viewer', description: 'Visualizador – apenas leitura de resultados agregados' },
  ];

  console.log('📌 Inserindo papéis...');
  const insertedRoles = await db
    .insert(schema.roles)
    .values(roleData)
    .onConflictDoNothing({ target: schema.roles.name })
    .returning();

  // 3. Mapear permissões para cada papel
  const getPermissionId = (code: string) =>
    insertedPermissions.find((p) => p.code === code)?.id;

  async function assignPermissions(roleName: string, permissionCodes: string[]) {
    const role = insertedRoles.find((r) => r.name === roleName);
    if (!role) return;
    const permissionIds = permissionCodes
      .map((code) => getPermissionId(code))
      .filter((id): id is number => id !== undefined);
    if (permissionIds.length === 0) return;
    const values = permissionIds.map((permissionId) => ({
      roleId: role.id,
      permissionId,
    }));
    await db.insert(schema.rolePermissions).values(values).onConflictDoNothing();
  }

  console.log('🔗 Associando permissões aos papéis...');

  // Admin: todas as permissões
  await assignPermissions(
    'admin',
    permissionData.map((p) => p.code)
  );

  // Pesquisador
  await assignPermissions('researcher', [
    'survey:create',
    'survey:edit',
    'survey:delete',
    'survey:view',
    'response:view_aggregated',
    'response:view_individual',
    'report:export',
  ]);

  // Visualizador
  await assignPermissions('viewer', [
    'survey:view',
    'response:view_aggregated',
  ]);

  // 4. Garantir existência do administrador padrão
  // Credenciais prioritárias: variáveis de ambiente; fallback para valores fixos
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminName = process.env.ADMIN_NAME || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  async function ensureAdminUser(email: string, name: string, password: string) {
    const [existingUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email));

    let userId = existingUser?.id;

    if (!userId) {
      const response = await auth.api.signUpEmail({
        body: { email, password, name },
        asResponse: false,
      });
      const newUser = (response as { user: { id: string; email: string; name: string } }).user;
      userId = newUser.id;
      console.log(`✅  Usuário ${email} criado com sucesso.`);
    } else {
      console.log(`ℹ️  Usuário ${email} já existe. Atualizando nome (se necessário)...`);
      // Opcional: atualizar nome se diferente
      await db.update(schema.user).set({ name }).where(eq(schema.user.id, userId));
    }

    const adminRole = insertedRoles.find((r) => r.name === 'admin');
    if (!adminRole) throw new Error('Role admin não encontrada');

    const [existingRole] = await db
      .select()
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, adminRole.id)
        )
      );

    if (!existingRole) {
      await db.insert(schema.userRoles).values({ userId, roleId: adminRole.id });
      console.log(`✅  Usuário ${email} agora é admin.`);
    } else {
      console.log(`ℹ️   Usuário ${email} já possui a role admin.`);
    }
  }

  // Cria/promove o admin padrão (definido via env ou fallback)
  await ensureAdminUser(adminEmail, adminName, adminPassword);

  // 5. Argumento extra (opcional) para outro email (apenas promove se existir)
  const extraAdminEmail = process.argv[2];
  if (extraAdminEmail) {
    // Sem nome/senha → só tenta promover
    const [user] = await db
      .select({ id: schema.user.id, name: schema.user.name })
      .from(schema.user)
      .where(eq(schema.user.email, extraAdminEmail));
    if (user) {
      await ensureAdminUser(extraAdminEmail, user.name, ''); // senha vazia não é usada
    } else {
      console.warn(`⚠️  Usuário ${extraAdminEmail} não encontrado. Apenas argumentos de email existentes são suportados para promoção.`);
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Erro durante seed:', err);
  process.exit(1);
});