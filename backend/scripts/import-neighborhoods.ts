// scripts/import-neighborhoods.ts
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const dbUrl = process.env.DATABASE_URL!;
if (!dbUrl) {
  console.error('❌ DATABASE_URL não definida. Verifique o .env.');
  process.exit(1);
}

async function importFromDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Diretório não encontrado: ${dirPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.warn('⚠️ Nenhum arquivo CSV encontrado no diretório.');
    process.exit(0);
  }

  console.log(`📂 Encontrados ${files.length} arquivo(s) CSV.`);

  const sql = postgres(dbUrl, { max: 1 });
  let totalImported = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    console.log(`📄 Processando: ${file}`);
    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => rows.push(data))
        .on('end', () => resolve())
        .on('error', reject);
    });

    console.log(`   Linhas lidas: ${rows.length}`);

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((r: any) => {
        const state = (r.state?.toString() ?? '').trim() || '';
        const city = (r.city?.toString() ?? '').trim() || '';
        const neighborhood = (r.location_name?.toString() ?? '').trim() || '';
        const type = (r.type?.toString() ?? '').trim() || '';
        return { state, city, ibgeCode: null, neighborhood, type };
      });

      try {
        await sql`
          INSERT INTO neighborhoods (state, city, ibge_code, neighborhood, type)
          VALUES ${sql(batch.map(b => [b.state, b.city, b.ibgeCode, b.neighborhood, b.type] as const))}
          ON CONFLICT (state, city, neighborhood, type) DO NOTHING
        `;
        totalImported += batch.length;
        console.log(`   ✔️ Inseridos ${i + batch.length} registros...`);
      } catch (err) {
        console.error(`   ❌ Erro no lote ${i}:`, err);
      }
    }

    console.log(`✅ ${file} concluído.\n`);
  }

  await sql.end();
  console.log(`🎉 Importação finalizada! Total de registros importados: ${totalImported}`);
  process.exit(0);
}

const dir = process.argv[2] || './neighborhoods-data';
importFromDirectory(dir).catch(err => {
  console.error('❌ Erro fatal na importação:', err);
  process.exit(1);
});