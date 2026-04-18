// src/shared/queue/export.queue.ts
import Queue from 'bull';
import { redis } from '../redis/index.js';

export interface ExportJobData {
  exportId: number;
  surveyId: number;
  format: 'csv' | 'xlsx' | 'json';
  userId: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    locationIds?: number[];
    // outros filtros
  };
}

export const exportQueue = new Queue<ExportJobData>('survey-exports', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
