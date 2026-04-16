// drizzle.config.ts (na raiz do backend)
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis do .env

export default defineConfig({
  schema: './src/shared/db/schema/index.ts', // arquivo barrel que exporta todos os schemas
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});