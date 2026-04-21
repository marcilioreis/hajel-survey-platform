// src/graphql/types.ts
import { SurveyEnriched } from '../shared/db/schema/views.types.js';
import { AggregatedResult } from '../modules/surveys/results.service.js';

export interface GraphQLContext {
  userId?: string;
}

export interface SurveyArgs {
  id: string;
}

export interface SurveyResultsArgs {
  surveyId: string;
  filters?: {
    startDate?: Date;
    endDate?: Date;
    locationIds?: number[];
  };
}

export interface CrossTabulationArgs {
  surveyId: string;
  questionA: string;
  questionB: string;
}

export interface CrossTabulationResult {
  rows: string[];
  columns: string[];
  data: number[][];
}
