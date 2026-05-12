import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined');
    process.exit(1);
  }

  const sql = postgres(connectionString, { 
    max: 1,
    ssl: connectionString.includes('localhost') ? false : 'require' 
  });
  
  const db = drizzle(sql);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  const journalPath = path.join(migrationsFolder, 'meta/_journal.json');

  console.log('🚀 Checking database migration state...');

  try {
    // 1. Verificar se a tabela de migrações existe e está vazia
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      );
    `;

    if (tableExists[0].exists) {
      const appliedMigrations = await sql`SELECT count(*) FROM drizzle.__drizzle_migrations`;
      
      // Se a tabela existe mas está vazia, e as tabelas principais já existem, vamos "sincronizar"
      if (parseInt(appliedMigrations[0].count) === 0) {
        const locationCatalogExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'location_catalog'
          );
        `;

        if (locationCatalogExists[0].exists) {
          console.log('⚠️ Database is out of sync (tables exist but migration history is empty).');
          console.log('🔄 Synchronizing migration history...');
          
          const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
          for (const entry of journal.entries) {
            await sql`
              INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
              VALUES (${entry.tag}, ${entry.when})
              ON CONFLICT DO NOTHING
            `;
            console.log(`✅ Marked ${entry.tag} as applied.`);
          }
          console.log('✨ Synchronization complete!');
        }
      }
    }

    console.log('📦 Running pending migrations...');
    await migrate(db, { migrationsFolder });
    console.log('✅ All migrations are up to date!');

  } catch (error) {
    console.error('❌ Migration process failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
