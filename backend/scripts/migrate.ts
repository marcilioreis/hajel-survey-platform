import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined');
    process.exit(1);
  }

  // Configuração para suportar SSL (obrigatório no Render)
  const sql = postgres(connectionString, { 
    max: 1,
    ssl: connectionString.includes('localhost') ? false : 'require' 
  });
  
  const db = drizzle(sql);

  console.log('🚀 Starting database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
