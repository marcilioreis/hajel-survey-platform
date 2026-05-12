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

  console.log('🚀 Starting database migrations...');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  
  console.log(`📂 Target migrations folder: ${migrationsFolder}`);

  // Debugging filesystem
  try {
    if (fs.existsSync(migrationsFolder)) {
      console.log('✅ Drizzle folder exists');
      const metaPath = path.join(migrationsFolder, 'meta');
      if (fs.existsSync(metaPath)) {
        console.log('✅ Meta folder exists');
        const journalPath = path.join(metaPath, '_journal.json');
        if (fs.existsSync(journalPath)) {
          console.log('✅ _journal.json exists');
        } else {
          console.log('❌ _journal.json MISSING at ' + journalPath);
        }
      } else {
        console.log('❌ Meta folder MISSING at ' + metaPath);
      }
    } else {
      console.log('❌ Drizzle folder MISSING at ' + migrationsFolder);
      console.log('Contents of parent directory:', fs.readdirSync(path.resolve(migrationsFolder, '..')));
    }
  } catch (e) {
    console.log('Debug check failed:', e);
  }
  
  try {
    await migrate(db, { migrationsFolder });
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
