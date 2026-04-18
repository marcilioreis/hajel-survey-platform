// src/modules/surveys/results.service.ts
import { db } from '../../shared/db/index.js';
import { sql, eq, and, inArray, gte, lte, count } from 'drizzle-orm';
import { surveys, questions } from '../../shared/db/schema/surveys.js';
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
) => {
  // Converte strings ISO para Date, se necessário
  const startDate = filters?.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters?.endDate ? new Date(filters.endDate) : undefined;
  const locationIds = filters?.locationIds;

  // 1. Buscar perguntas da pesquisa
  const surveyQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.surveyId, surveyId))
    .orderBy(questions.order);

  console.log('surveyQuestions :>> ', surveyQuestions);

  // 2. Construir a base de respostas completadas com filtros
  const conditions = [
    eq(responseSessions.surveyId, surveyId),
    eq(responseSessions.status, 'concluida'),
  ];

  if (startDate) {
    conditions.push(gte(responseSessions.completedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(responseSessions.completedAt, endDate));
  }

  // Query base com join e condições
  const completedSessions = await db
    .select({ sessionId: responseSessions.id })
    .from(responseSessions)
    .innerJoin(respondents, eq(responseSessions.id, respondents.sessionId))
    .where(and(...conditions));

  console.log('completedSessions :>> ', completedSessions);

  // Se houver filtro de locationIds, aplicar após o join
  let sessionIds = completedSessions.map((s) => s.sessionId);
  if (filters?.locationIds && filters.locationIds.length > 0) {
    const filteredSessions = await db
      .select({ sessionId: responseSessions.id })
      .from(responseSessions)
      .innerJoin(respondents, eq(responseSessions.id, respondents.sessionId))
      .where(and(...conditions, inArray(respondents.locationId, filters.locationIds)));
    sessionIds = filteredSessions.map((s) => s.sessionId);
  }

  console.log('sessionIds :>> ', sessionIds);

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

  // 3. Para cada pergunta, buscar contagens agrupadas por valor
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

    console.log('question :>> ', question);
    console.log('answersData :>> ', answersData);

    // Processar conforme tipo
    const data: AggregatedResult['data'] = [];

    if (question.type === 'unica_escolha' || question.type === 'multipla_escolha') {
      const options: string[] = (question.options as string[]) || [];
      const counts = new Map<string, number>();
      for (const row of answersData) {
        const val = row.value as string;
        counts.set(val, (counts.get(val) || 0) + Number(row.count));
      }
      for (const opt of options) {
        const cnt = counts.get(opt) || 0;
        data.push({
          option: opt,
          count: cnt,
          percentage: totalCompleted > 0 ? (cnt / totalCompleted) * 100 : 0,
        });
      }
    } else if (question.type === 'texto_curto' || question.type === 'texto_longo') {
      // Para perguntas abertas, podemos retornar lista de respostas (apenas se permitido)
      // Aqui retornamos apenas contagem de respostas, sem opções
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

// Dados para exportação (formato tabular)
export const getExportData = async (surveyId: number, filters?: any, format?: string) => {
  const results = await getSurveyResults(surveyId, filters);
  console.log('results :>> ', results);
  // Transforma em formato adequado para CSV (exemplo simplificado)
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
