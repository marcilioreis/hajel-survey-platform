import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
async function run() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const journalPath = path.resolve(__dirname, '../drizzle/meta/_journal.json');
  console.log('🔄 Sincronizando histórico de migrações...');
  try {
    // Garante que a tabela de migrações existe
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    
    for (const entry of journal.entries) {
      // Inserimos o 'tag' como hash (o Drizzle ORM aceita isso para sincronização manual)
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${entry.tag}, ${entry.when})
        ON CONFLICT DO NOTHING
      `;
      console.log(`✅ Marcada como aplicada: ${entry.tag}`);
    }
    console.log('✨ Banco de dados sincronizado com sucesso!');
  } catch (e) {
    console.error('❌ Falha na sincronização:', e);
  } finally {
    await sql.end();
  }
}
run();