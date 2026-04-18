// src/modules/responses/responses.service.ts
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../../shared/db/index.js';
import { questions } from '../../shared/db/schema/surveys.js';
import { responseSessions, respondents, answers } from '../../shared/db/schema/responses.js';
import type { InsertRespondent } from '../../shared/db/schema/responses.js';
// Tipos importados para documentação e possíveis extensões
// import type { InsertRespondent, InsertAnswer } from '../../shared/db/schema/responses.js';

// ========== SESSÃO ==========

/**
 * Inicia uma nova sessão de resposta para uma pesquisa.
 */
export const startSession = async (surveyId: number, ip?: string, userAgent?: string) => {
  const token = randomBytes(32).toString('hex');
  const [session] = await db
    .insert(responseSessions)
    .values({
      surveyId,
      token,
      ip,
      userAgent,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      status: 'em_andamento',
    })
    .returning();
  return session;
};

/**
 * Obtém uma sessão pelo token, garantindo que não expirou (ex: 24h sem atividade).
 */
export const getSessionByToken = async (token: string) => {
  const [session] = await db
    .select()
    .from(responseSessions)
    .where(eq(responseSessions.token, token))
    .limit(1);

  if (!session) return null;

  // Garantimos que lastActivityAt não é nulo (definido na criação)
  const lastActivity = session.lastActivityAt ?? new Date();
  const now = new Date();
  const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastActivity > 24) {
    await db
      .update(responseSessions)
      .set({ status: 'abandonada' })
      .where(eq(responseSessions.id, session.id));
    return null;
  }
  return session;
};

/**
 * Atualiza o timestamp de última atividade da sessão.
 */
export const touchSession = async (sessionId: number) => {
  await db
    .update(responseSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(responseSessions.id, sessionId));
};

// ========== PERGUNTAS ==========

/**
 * Busca uma pergunta pelo ID, garantindo que pertence à pesquisa da sessão.
 */
export const getQuestionForSession = async (sessionId: number, questionId: number) => {
  const [session] = await db
    .select({ surveyId: responseSessions.surveyId })
    .from(responseSessions)
    .where(eq(responseSessions.id, sessionId));

  if (!session) return null;

  const [question] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.surveyId, session.surveyId)));

  return question;
};

// ========== RESPOSTAS ==========

/**
 * Salva uma resposta para uma pergunta.
 * Se já existir uma resposta para a mesma sessão e pergunta, atualiza.
 */
export const saveAnswer = async (
  sessionId: number,
  questionId: number,
  value: unknown // valor validado antes de chamar este método
) => {
  const [existing] = await db
    .select({ id: answers.id })
    .from(answers)
    .where(and(eq(answers.sessionId, sessionId), eq(answers.questionId, questionId)));

  if (existing) {
    const [updated] = await db
      .update(answers)
      .set({ value: value as any, answeredAt: new Date() }) // value já validado
      .where(eq(answers.id, existing.id))
      .returning();
    return updated;
  }

  const [newAnswer] = await db
    .insert(answers)
    .values({
      sessionId,
      questionId,
      value: value as any, // value validado
      answeredAt: new Date(),
    })
    .returning();
  return newAnswer;
};

/**
 * Busca todas as respostas de uma sessão (útil para retomar).
 */
export const getAnswersBySession = async (sessionId: number) => {
  return db.select().from(answers).where(eq(answers.sessionId, sessionId));
};

// ========== FINALIZAÇÃO E PERFIL ==========

/**
 * Finaliza a sessão e salva os dados do respondente.
 */
export const completeSession = async (
  sessionId: number,
  respondentData: Omit<InsertRespondent, 'sessionId' | 'id'>
) => {
  await db
    .update(responseSessions)
    .set({ status: 'concluida', completedAt: new Date() })
    .where(eq(responseSessions.id, sessionId));

  const [respondent] = await db
    .insert(respondents)
    .values({
      ...respondentData,
      sessionId,
    })
    .returning();
  return respondent;
};

// ========== VALIDAÇÕES ==========

/**
 * Verifica se uma resposta é válida conforme o tipo da pergunta.
 */
export const validateAnswer = (
  questionType: string,
  value: unknown,
  options?: unknown
): boolean => {
  switch (questionType) {
    case 'unica_escolha':
      return Array.isArray(options) && typeof value === 'string' && options.includes(value);
    case 'multipla_escolha':
      return (
        Array.isArray(value) &&
        Array.isArray(options) &&
        value.every((v) => typeof v === 'string' && options.includes(v))
      );
    case 'texto_curto':
      return typeof value === 'string' && value.trim().length > 0;
    case 'texto_longo':
      return typeof value === 'string';
    default:
      return true;
  }
};
