// src/modules/surveys/reports.service.ts
import { db } from '../../shared/db/index.js';
import { reports, exportedReports } from '../../shared/db/schema/reports.js';
import { eq } from 'drizzle-orm';
import type { InsertExportedReport } from '../../shared/db/schema/reports.js';

export const createExportRequest = async (
  surveyId: number,
  userId: string,
  format: 'csv' | 'xlsx' | 'json',
  filters?: any
) => {
  const [exportRecord] = await db
    .insert(exportedReports)
    .values({
      surveyId,
      userId,
      format,
      filters,
      status: 'pendente',
    })
    .returning();
  return exportRecord;
};

export const updateExportStatus = async (
  exportId: number,
  status: 'processando' | 'concluido' | 'falha'
) => {
  await db.update(exportedReports).set({ status }).where(eq(exportedReports.id, exportId));
};

export const completeExport = async (
  exportId: number,
  fileName: string,
  fileSize: number,
  downloadLink: string
) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(exportedReports)
    .set({
      status: 'concluido',
      fileName,
      fileSize,
      downloadLink,
      expiresAt,
    })
    .where(eq(exportedReports.id, exportId));
};

export const getExportById = async (exportId: number) => {
  const [exp] = await db.select().from(exportedReports).where(eq(exportedReports.id, exportId));
  return exp;
};

export const listExportsBySurvey = async (surveyId: number) => {
  return db
    .select()
    .from(exportedReports)
    .where(eq(exportedReports.surveyId, surveyId))
    .orderBy(exportedReports.exportedAt);
};
