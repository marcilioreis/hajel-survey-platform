import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function listTables() {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log('✅ Tabelas encontradas:');
  tables.forEach((t) => console.log('  -', t.table_name));
  await sql.end();
}

listTables().catch(console.error);