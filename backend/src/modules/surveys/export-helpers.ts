import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { ExportRow } from './results.service.js';

/**
 * Gera buffer PDF a partir dos dados de exportação.
 */
export function generatePdf(data: ExportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).text('Relatório de Resultados', { align: 'center' });
    doc.moveDown();

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
