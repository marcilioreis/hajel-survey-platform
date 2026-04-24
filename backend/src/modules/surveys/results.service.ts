// src/modules/surveys/results.service.ts
import { eq, and, inArray, gte, lte, count } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { questions } from '../../shared/db/schema/surveys.js';
import { answers, responseSessions, respondents } from '../../shared/db/schema/responses.js';

export interface AggregatedResult {
  questionId: number;
  questionText: string;
  type: string;
  totalResponses: number;
  data: {
    option?: string;
    count: number;
    percentage: number;
  }[];
}

export const getSurveyResults = async (
  surveyId: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    locationIds?: number[];
  }
): Promise<AggregatedResult[]> => {
  const startDate = filters?.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters?.endDate ? new Date(filters.endDate) : undefined;
  const filterLocationIds = filters?.locationIds; // renomeado para evitar conflito

  // 1. Buscar perguntas da pesquisa
  const surveyQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.surveyId, surveyId))
    .orderBy(questions.order);

  // 2. Construir a base de sessões concluídas
  const conditions = [
    eq(responseSessions.surveyId, surveyId),
    eq(responseSessions.status, 'concluida'),
  ];
  if (startDate) conditions.push(gte(responseSessions.completedAt, startDate));
  if (endDate) conditions.push(lte(responseSessions.completedAt, endDate));

  let completedSessions = await db
    .select({ sessionId: responseSessions.id })
    .from(responseSessions)
    .innerJoin(respondents, eq(responseSessions.id, respondents.sessionId))
    .where(and(...conditions));

  // 3. Aplicar filtro de localizações, se existir
  let sessionIds: number[];
  if (filterLocationIds && filterLocationIds.length > 0) {
    const filtered = await db
      .select({ sessionId: responseSessions.id })
      .from(responseSessions)
      .innerJoin(respondents, eq(responseSessions.id, respondents.sessionId))
      .where(and(...conditions, inArray(respondents.locationId, filterLocationIds)));
    sessionIds = filtered.map((s) => s.sessionId);
  } else {
    sessionIds = completedSessions.map((s) => s.sessionId);
  }

  const totalCompleted = sessionIds.length;

  if (totalCompleted === 0) {
    return surveyQuestions.map((q) => ({
      questionId: q.id,
      questionText: q.text,
      type: q.type,
      totalResponses: 0,
      data: [],
    }));
  }

  // 4. Resultados por pergunta
  const results: AggregatedResult[] = [];

  for (const question of surveyQuestions) {
    const answersData = await db
      .select({
        value: answers.value,
        count: count(answers.id).as('count'),
      })
      .from(answers)
      .where(and(eq(answers.questionId, question.id), inArray(answers.sessionId, sessionIds)))
      .groupBy(answers.value);

    const data: AggregatedResult['data'] = [];

    if (question.type === 'unica_escolha' || question.type === 'multipla_escolha') {
      const options: string[] = (question.options as string[]) || [];
      const counts = new Map<string, number>();

      for (const row of answersData) {
        let values: string[] = [];

        if (Array.isArray(row.value)) {
          values = row.value as string[];
        } else if (typeof row.value === 'string') {
          try {
            const parsed = JSON.parse(row.value);
            values = Array.isArray(parsed) ? parsed : [row.value];
          } catch {
            const cleaned = row.value.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
            values = [cleaned];
          }
        }

        if (question.type === 'unica_escolha') {
          const val = values[0] ?? '';
          if (val) counts.set(val, (counts.get(val) || 0) + Number(row.count));
        } else {
          for (const val of values) {
            if (val) counts.set(val, (counts.get(val) || 0) + Number(row.count));
          }
        }
      }

      for (const opt of options) {
        const cnt = counts.get(opt) || 0;
        data.push({
          option: opt,
          count: cnt,
          percentage: totalCompleted > 0 ? (cnt / totalCompleted) * 100 : 0,
        });
      }
    } else if (question.type === 'texto_longo' || question.type === 'texto_curto') {
      const totalAnswers = answersData.reduce((sum, row) => sum + Number(row.count), 0);
      data.push({
        option: 'Respostas',
        count: totalAnswers,
        percentage: totalCompleted > 0 ? (totalAnswers / totalCompleted) * 100 : 0,
      });
    }

    results.push({
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      totalResponses: totalCompleted,
      data,
    });
  }

  return results;
};

export const getExportData = async (surveyId: number, filters?: any, format?: string) => {
  const results = await getSurveyResults(surveyId, filters);
  console.log('results :>> ', results);
  const flatData: any[] = [];
  for (const r of results) {
    for (const d of r.data) {
      flatData.push({
        pergunta: r.questionText,
        opcao: d.option || '-',
        quantidade: d.count,
        percentual: d.percentage.toFixed(2) + '%',
      });
    }
  }
  return flatData;
};

/**
 * Retorna as respostas individuais para perguntas abertas (texto_curto, texto_longo)
 */
export const getOpenEndedResponses = async (
  surveyId: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    locationIds?: number[];
  }
): Promise<
  {
    questionId: number;
    questionText: string;
    type: string;
    responses: string[];
  }[]
> => {
  // 1. Obter sessionIds válidas (mesma lógica de getSurveyResults)
  const surveyQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.surveyId, surveyId))
    .orderBy(questions.order);

  const startDate = filters?.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters?.endDate ? new Date(filters.endDate) : undefined;
  const filterLocationIds = filters?.locationIds;

  const conditions = [
    eq(responseSessions.surveyId, surveyId),
    eq(responseSessions.status, 'concluida'),
  ];
  if (startDate) conditions.push(gte(responseSessions.completedAt, startDate));
  if (endDate) conditions.push(lte(responseSessions.completedAt, endDate));

  let sessionIds: number[];
  if (filterLocationIds && filterLocationIds.length > 0) {
    const filtered = await db
      .select({ sessionId: responseSessions.id })
      .from(responseSessions)
      .innerJoin(respondents, eq(responseSessions.id, respondents.sessionId))
      .where(and(...conditions, inArray(respondents.locationId, filterLocationIds)));
    sessionIds = filtered.map((s) => s.sessionId);
  } else {
    const completedSessions = await db
      .select({ sessionId: responseSessions.id })
      .from(responseSessions)
      .innerJoin(respondents, eq(responseSessions.id, respondents.sessionId))
      .where(and(...conditions));
    sessionIds = completedSessions.map((s) => s.sessionId);
  }

  // 2. Filtrar apenas perguntas abertas
  const openQuestions = surveyQuestions.filter(
    (q) => q.type === 'texto_curto' || q.type === 'texto_longo'
  );

  if (sessionIds.length === 0 || openQuestions.length === 0) {
    return openQuestions.map((q) => ({
      questionId: q.id,
      questionText: q.text,
      type: q.type,
      responses: [],
    }));
  }

  // 3. Para cada pergunta aberta, buscar todas as respostas
  const result: {
    questionId: number;
    questionText: string;
    type: string;
    responses: string[];
  }[] = [];

  for (const question of openQuestions) {
    const answerRows = await db
      .select({ value: answers.value })
      .from(answers)
      .where(and(eq(answers.questionId, question.id), inArray(answers.sessionId, sessionIds)));

    const responses = answerRows.map((row) => {
      // Normaliza o valor para string legível
      if (typeof row.value === 'string') {
        // Remove escapes simples (ex: "25-34" -> 25-34)
        return row.value.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
      }
      return String(row.value ?? '');
    });

    result.push({
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      responses,
    });
  }

  return result;
};
