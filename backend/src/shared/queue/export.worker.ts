import fs from 'fs/promises';
import path from 'path';
import { json2csv } from 'json-2-csv';
import { Job } from 'bull';
import { exportQueue } from './export.queue.js';
import * as reportsService from '../../modules/surveys/reports.service.js';
import type { ExportFilters } from '../../modules/surveys/reports.service.js';
import * as resultsService from '../../modules/surveys/results.service.js';
interface ExportJobData {
  exportId: number;
  surveyId: number;
  format: 'csv' | 'xlsx' | 'json';
  userId: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    locationIds?: number[];
  };
}

export const startExportWorker = () => {
  exportQueue.process(async (job: Job<ExportJobData>) => {
    const { exportId, surveyId, format, filters: rawFilters } = job.data;
    console.info(`📤 Job ${exportId} iniciado`);

    try {
      // Atualiza status para 'processando'
      console.info(`🔄 Atualizando status para 'processando'...`);
      await reportsService.updateExportStatus(exportId, 'processando');
      console.info(`✅ Status atualizado`);

      // Converte strings de data para Date, se existirem
      const filters: ExportFilters = {};
      if (rawFilters?.startDate) filters.startDate = new Date(rawFilters.startDate);
      if (rawFilters?.endDate) filters.endDate = new Date(rawFilters.endDate);
      if (rawFilters?.locationIds) filters.locationIds = rawFilters.locationIds;

      // Busca os dados agregados ou individuais conforme configuração
      console.info(
        `📊 Buscando dados da pesquisa... surveyId: ${surveyId}  -  filters: ${filters?.startDate}  -  format: ${format}  `
      );

      const data = await resultsService.getExportData(surveyId, filters, format);
      console.info(`📊 Dados obtidos: ${data.length} linhas`);

      if (data.length === 0) {
        console.warn('⚠️ Nenhum dado retornado por getExportData.');
      } else {
        console.info('Primeiras 2 linhas:', JSON.stringify(data.slice(0, 2)));
      }

      let fileContent: Buffer | string;
      let mimeType: string;
      let extension: string;

      if (format === 'csv') {
        fileContent = json2csv(data);
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (format === 'json') {
        fileContent = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // xlsx - precisaria de uma lib como 'xlsx'
        throw new Error('Formato XLSX não implementado ainda');
      }

      // Salva o arquivo em disco (ou S3)
      const fileName = `export_${exportId}_${Date.now()}.${extension}`;
      console.info(`💾 Salvando arquivo ${fileName}...`);
      const filePath = path.join(process.cwd(), 'exports', fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, fileContent);

      // Atualiza o registro de exportação com o link
      const downloadLink = `/api/exports/${exportId}/download`;
      console.info(`📝 Finalizando exportação no banco...`);
      await reportsService.completeExport(
        exportId,
        fileName,
        Buffer.byteLength(fileContent),
        downloadLink
      );
      console.info(`✅ Exportação ${exportId} concluída`);

      return { success: true, fileName };
    } catch (error) {
      console.error(`Export job ${exportId} failed:`, error);
      await reportsService.updateExportStatus(exportId, 'falha');
      throw error;
    }
  });
};
