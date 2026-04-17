// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega explicitamente o arquivo .env da raiz do backend
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Verificação de segurança (apenas para debug, pode remover depois)
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL não está definida no .env');
}

export default defineConfig({
  schema: './src/shared/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});