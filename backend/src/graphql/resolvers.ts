// src/graphql/resolvers.ts
import { GraphQLScalarType, Kind } from 'graphql';
import * as surveyService from '../modules/surveys/surveys.service.js';
import * as resultsService from '../modules/surveys/results.service.js';
import { hasPermission } from '../shared/middleware/rbac.js';
import { db } from '../shared/db/index.js';
import { answers, responseSessions } from '../shared/db/schema/responses.js';
import { questions } from '../shared/db/schema/surveys.js';
import { eq, and, inArray } from 'drizzle-orm';
import type {
  GraphQLContext,
  SurveyArgs,
  SurveyResultsArgs,
  CrossTabulationArgs,
  CrossTabulationResult,
} from './types.js';

// Scalars

// DateTime scalar
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar',
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    throw new Error('DateTime can only serialize Date objects');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') return new Date(value);
    throw new Error('DateTime can only parse string');
  },
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
} as GraphQLScalarType); // 👈 Asserção para contornar a tipagem estrita

// JSON scalar
const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return null;
      }
    }
    return null;
  },
} as GraphQLScalarType);

export const resolvers = {
  DateTime: dateTimeScalar,
  JSON: jsonScalar,

  Query: {
    surveys: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const { userId } = context;
      if (!userId) throw new Error('Unauthorized');

      const canViewAny = await hasPermission(userId, 'survey:view_any');
      if (canViewAny) {
        return surveyService.findAllSurveysEnriched();
      }

      const canViewOwn = await hasPermission(userId, 'survey:view');
      if (canViewOwn) {
        return surveyService.findAllEnriched(userId);
      }

      return surveyService.findPublicSurveysEnriched(userId);
      //   const isAdmin = await hasPermission(userId, 'survey:view_any');
      //   return surveyService.findAccessibleSurveys(userId, isAdmin);
    },

    survey: async (_parent: unknown, { id }: SurveyArgs, context: GraphQLContext) => {
      const { userId } = context;
      if (!userId) throw new Error('Unauthorized');
      const survey = await surveyService.findByIdWithAccess(parseInt(id, 10), userId);
      if (!survey) throw new Error('Survey not found or access denied');
      return survey;
    },

    surveyResults: async (
      _parent: unknown,
      { surveyId, filters }: SurveyResultsArgs,
      context: GraphQLContext
    ) => {
      const { userId } = context;
      if (!userId) throw new Error('Unauthorized');

      const canView = await hasPermission(userId, 'response:view_aggregated');
      const survey = await surveyService.findById(parseInt(surveyId, 10));
      if (!survey) throw new Error('Survey not found');
      const isOwner = survey.createdBy === userId;
      if (!canView && !isOwner) throw new Error('Forbidden');

      const parsedFilters = {
        startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
        locationIds: filters?.locationIds,
      };
      return resultsService.getSurveyResults(parseInt(surveyId, 10), parsedFilters);
    },

    crossTabulation: async (
      _parent: unknown,
      { surveyId, questionA, questionB }: CrossTabulationArgs,
      context: GraphQLContext
    ): Promise<CrossTabulationResult> => {
      const { userId } = context;
      if (!userId) throw new Error('Unauthorized');

      const canView = await hasPermission(userId, 'response:view_aggregated');
      const survey = await surveyService.findById(parseInt(surveyId, 10));
      if (!survey) throw new Error('Survey not found');
      const isOwner = survey.createdBy === userId;
      if (!canView && !isOwner) throw new Error('Forbidden');

      const numericSurveyId = parseInt(surveyId, 10);
      const numericQIdA = parseInt(questionA, 10);
      const numericQIdB = parseInt(questionB, 10);

      const sessions = await db
        .select({ id: answers.sessionId })
        .from(answers)
        .innerJoin(responseSessions, eq(answers.sessionId, responseSessions.id))
        .where(
          and(
            eq(responseSessions.surveyId, numericSurveyId),
            eq(responseSessions.status, 'concluida')
          )
        )
        .groupBy(answers.sessionId);

      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length === 0) {
        return { rows: [], columns: [], data: [] };
      }

      const answersA = await db
        .select({ sessionId: answers.sessionId, value: answers.value })
        .from(answers)
        .where(and(eq(answers.questionId, numericQIdA), inArray(answers.sessionId, sessionIds)));

      const answersB = await db
        .select({ sessionId: answers.sessionId, value: answers.value })
        .from(answers)
        .where(and(eq(answers.questionId, numericQIdB), inArray(answers.sessionId, sessionIds)));

      const mapA = new Map(answersA.map((a) => [a.sessionId, a.value as string]));
      const mapB = new Map(answersB.map((b) => [b.sessionId, b.value as string]));

      const [qA] = await db.select().from(questions).where(eq(questions.id, numericQIdA));
      const [qB] = await db.select().from(questions).where(eq(questions.id, numericQIdB));

      const optionsA = (qA?.options as string[]) || [];
      const optionsB = (qB?.options as string[]) || [];

      const matrix: Record<string, Record<string, number>> = {};
      for (const optA of optionsA) {
        matrix[optA] = {};
        for (const optB of optionsB) {
          matrix[optA][optB] = 0;
        }
      }

      for (const sessionId of sessionIds) {
        const valA = mapA.get(sessionId);
        const valB = mapB.get(sessionId);
        if (valA && valB && matrix[valA]?.[valB] !== undefined) {
          matrix[valA][valB] += 1;
        }
      }

      const rows = optionsA;
      const columns = optionsB;
      const data = rows.map((row) => columns.map((col) => matrix[row][col]));

      return { rows, columns, data };
    },
  },
};
