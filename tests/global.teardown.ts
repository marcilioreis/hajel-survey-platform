// tests/global.teardown.ts
import { execSync } from 'child_process';
import path from 'path';

async function globalTeardown() {
  const backendDir = path.resolve(__dirname, '..', 'backend');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida para o ambiente de teste');
  }

  console.log('🧹 Limpando banco de teste...');
  // Exemplo: executar um script SQL de limpeza
  execSync(`psql $DATABASE_URL -c "TRUNCATE surveys, questions, locations, response_sessions, respondents, answers CASCADE;"`, {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

export default globalTeardown;