import Queue from 'bull';
import { redis } from '../redis/index.js';

export interface ExportJobData {
  exportId: number;
  surveyId: number;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  userId: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    locationIds?: number[];
  };
}

export const exportQueue = new Queue<ExportJobData>('survey-exports', {
  redis: redis,
});
