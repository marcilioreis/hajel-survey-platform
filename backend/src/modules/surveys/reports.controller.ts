// src/modules/surveys/reports.controller.ts
import { Request, Response } from 'express';
import * as reportsService from './reports.service.js';
import * as surveyService from './surveys.service.js';
import { exportQueue } from '../../shared/queue/export.queue.js';
import { hasPermission } from '../../shared/middleware/rbac.js';
import path from 'path';
import fs from 'fs/promises';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const requestExport = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;
    const { format = 'csv', filters } = req.body;

    // Converte datas para string ISO se existirem
    const sanitizedFilters = filters
      ? {
          ...filters,
          startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
          endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
          // locationIds já é array de números, não precisa alterar
        }
      : undefined;

    // Verifica permissão de exportar relatórios
    const canExport = await hasPermission(userId, 'report:export');
    const survey = await surveyService.findById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada' });
    const isOwner = survey.createdBy === userId;
    if (!canExport && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Cria registro de exportação
    const exportRecord = await reportsService.createExportRequest(
      surveyId,
      userId,
      format,
      sanitizedFilters
    );

    // Enfileira job
    await exportQueue.add({
      exportId: exportRecord.id,
      surveyId,
      format,
      userId,
      filters: sanitizedFilters,
    });

    res.status(202).json({
      exportId: exportRecord.id,
      status: 'pendente',
      message:
        'Exportação solicitada. Você pode verificar o status em /api/exports/:exportId/status',
    });
  } catch (error) {
    console.error('Request export error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getExportStatus = async (req: Request, res: Response) => {
  try {
    const exportId = getNumericId(req.params.exportId);
    const exportRecord = await reportsService.getExportById(exportId);
    if (!exportRecord) return res.status(404).json({ error: 'Exportação não encontrada' });
    res.json({
      id: exportRecord.id,
      status: exportRecord.status,
      downloadLink: exportRecord.status === 'concluido' ? exportRecord.downloadLink : null,
    });
  } catch (error) {
    console.error('Get export status error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const downloadExport = async (req: Request, res: Response) => {
  try {
    const exportId = getNumericId(req.params.exportId);
    const exportRecord = await reportsService.getExportById(exportId);
    if (!exportRecord || exportRecord.status !== 'concluido') {
      return res.status(404).json({ error: 'Exportação não está pronta ou não encontrada' });
    }

    const filePath = path.join(process.cwd(), 'exports', exportRecord.fileName!);
    const stat = await fs.stat(filePath);
    res.setHeader('Content-Type', exportRecord.format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
    res.setHeader('Content-Length', stat.size);
    const fileStream = await fs.open(filePath, 'r');
    fileStream.createReadStream().pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Arquivo não encontrado' });
  }
};
