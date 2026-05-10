import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

async function globalSetup() {
  // Carrega variáveis do .env.test (se existir)
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL não definida');

  // 1. Recriar banco de dados de teste
  const dbUrl = new URL(databaseUrl);
  const dbName = dbUrl.pathname.slice(1);
  dbUrl.pathname = '/postgres';
  const adminSql = postgres(dbUrl.toString(), { max: 1 });
  try {
    await adminSql`DROP DATABASE IF EXISTS ${adminSql(dbName)}`;
    await adminSql`CREATE DATABASE ${adminSql(dbName)}`;
    console.log(`✅ Banco '${dbName}' recriado.`);
  } finally {
    await adminSql.end();
  }

  // 2. Executar migrações
  console.log('🔧 Executando migrações (drizzle-kit push:pg)...');
  const backendDir = path.resolve(__dirname, '..', 'backend');
  execSync('npx drizzle-kit push', {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  // 3. Verificar se as tabelas foram criadas
  const checkSql = postgres(databaseUrl, { max: 1 });
  try {
    const tables = await checkSql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('permissions', 'surveys')
    `;
    if (tables.length < 2) {
      throw new Error(
        'Migrações não criaram as tabelas esperadas. Verifique o comando drizzle-kit.'
      );
    }
    console.log('✅ Tabelas permissions e surveys existem.');
  } finally {
    await checkSql.end();
  }

  // 4. Executar seed
  console.log('🌱 Executando seed...');
  execSync('npx tsx scripts/seed.ts', {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

export default globalSetup;