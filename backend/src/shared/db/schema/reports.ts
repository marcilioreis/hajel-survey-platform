// src/shared/db/schema/reports.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { surveys } from './surveys.js';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  surveyId: integer('survey_id')
    .references(() => surveys.id, { onDelete: 'cascade' })
    .notNull(),
  createdBy: text('created_by')
    .references(() => user.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  config: jsonb('config').notNull(),
  public: boolean('public').default(false),
  schedule: jsonb('schedule'), // agendamento
});

export const exportedReports = pgTable('exported_reports', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id, { onDelete: 'cascade' }), // nova coluna
  reportId: integer('report_id').references(() => reports.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .references(() => user.id)
    .notNull(),
  exportedAt: timestamp('exported_at').defaultNow(),
  format: varchar('format', { length: 20 }).notNull(),
  filters: jsonb('filters'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  status: varchar('status', { length: 20 }).default('concluido'),
  downloadLink: text('download_link'),
  expiresAt: timestamp('expires_at'),
});

// ... definições das tabelas ...
// Tipos inferidos
export type Report = InferSelectModel<typeof reports>;
export type InsertReport = InferInsertModel<typeof reports>;
export type ExportedReport = InferSelectModel<typeof exportedReports>;
export type InsertExportedReport = InferInsertModel<typeof exportedReports> & {
  filters?: {
    startDate?: string;
    endDate?: string;
    locationIds?: number[];
  } | null;
};
