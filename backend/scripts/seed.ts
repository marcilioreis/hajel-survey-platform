// scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // carrega DATABASE_URL

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/shared/db/schema';
import { eq } from 'drizzle-orm';

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
    {
      name: 'admin',
      description: 'Administrador do sistema – acesso total',
    },
    {
      name: 'researcher',
      description: 'Pesquisador – pode criar e gerenciar suas pesquisas',
    },
    {
      name: 'viewer',
      description: 'Visualizador – apenas leitura de resultados agregados',
    },
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

  // Função auxiliar para associar permissões a um papel
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

  // 4. Opcional: Atribuir papel admin a um usuário específico via argumento
  const adminEmail = process.argv[2];
  if (adminEmail) {
    console.log(`👤 Atribuindo papel 'admin' ao usuário ${adminEmail}...`);
    const [user] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, adminEmail));
    if (user) {
      const adminRole = insertedRoles.find((r) => r.name === 'admin');
      if (adminRole) {
        await db
          .insert(schema.userRoles)
          .values({ userId: user.id, roleId: adminRole.id })
          .onConflictDoNothing();
        console.log(`✅ Usuário ${adminEmail} agora é admin.`);
      }
    } else {
      console.warn(`⚠️ Usuário com email ${adminEmail} não encontrado.`);
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Erro durante seed:', err);
  process.exit(1);
});