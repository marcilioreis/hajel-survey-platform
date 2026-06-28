import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { ExportRow } from './results.service.js';

// Metadados de amostragem exibidos no cabeçalho do PDF (frações em 0–1).
export interface SamplingMeta {
  sampleSize?: number | null;
  marginOfError?: number | null;
  populationSize?: number | null;
  confidenceLevel?: number | null;
  expectedProportion?: number | null;
  responseRate?: number | null;
  responsesCount?: number | null;
}

const pct = (frac?: number | null, digits = 1): string =>
  frac == null ? '—' : `${(frac * 100).toFixed(digits)}%`;

/**
 * Gera buffer PDF a partir dos dados de exportação.
 */
export function generatePdf(data: ExportRow[], sampling?: SamplingMeta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).text('Relatório de Resultados', { align: 'center' });
    doc.moveDown();

    // Ficha técnica da amostra (quando houver parâmetros definidos)
    if (sampling && (sampling.sampleSize != null || sampling.marginOfError != null)) {
      doc.fontSize(12).text('Ficha técnica da amostra');
      doc
        .fontSize(10)
        .text(
          `Margem de erro: ${pct(sampling.marginOfError)}  -  ` +
            `Amostra planejada: ${sampling.sampleSize ?? '—'}  -  ` +
            `Nível de confiança: ${pct(sampling.confidenceLevel, 0)}`
        );
      doc
        .fontSize(10)
        .text(
          `Proporção esperada: ${pct(sampling.expectedProportion, 0)}  -  ` +
            `População: ${sampling.populationSize ?? 'Infinita'}  -  ` +
            `Taxa de resposta: ${pct(sampling.responseRate, 0)}  -  ` +
            `Coletado: ${sampling.responsesCount ?? 0}`
        );
      doc.moveDown();
    }

    data.forEach((row) => {
      doc.fontSize(10).text(`${row.pergunta}`);
      doc
        .fontSize(10)
        .text(
          `Opção: ${row.opcao}  -  Quantidade: ${row.quantidade}  -  Percentual: ${row.percentual}`
        );
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

/**
 * Gera buffer XLSX a partir dos dados de exportação.
 */
export async function generateXlsx(data: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Resultados');

  sheet.columns = [
    { header: 'Pergunta', key: 'pergunta', width: 40 },
    { header: 'Opção', key: 'opcao', width: 20 },
    { header: 'Quantidade', key: 'quantidade', width: 15 },
    { header: 'Percentual', key: 'percentual', width: 15 },
  ];

  data.forEach((row) => sheet.addRow(row));

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
