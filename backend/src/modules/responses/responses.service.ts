// src/modules/responses/responses.service.ts
import { eq, and, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../../shared/db/index.js';
import { questions } from '../../shared/db/schema/surveys.js';
import { responseSessions, respondents, answers } from '../../shared/db/schema/responses.js';
import type { InsertRespondent } from '../../shared/db/schema/responses.js';
export interface AnswerPayload {
  questionId: number;
  value: unknown;
}

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

// src/modules/responses/responses.service.ts

/**
 * Obtém ou cria uma sessão de resposta para um usuário autenticado.
 * Se já existir uma sessão 'em_andamento' para esse usuário e pesquisa, retorna-a.
 * Caso contrário, cria uma nova.
 */
export const getOrCreateUserSession = async (
  surveyId: number,
  userId: string,
  ip?: string,
  userAgent?: string
) => {
  // Buscar sessão existente
  const [existing] = await db
    .select()
    .from(responseSessions)
    .where(
      and(
        eq(responseSessions.surveyId, surveyId),
        eq(responseSessions.userId, userId),
        eq(responseSessions.status, 'em_andamento')
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  // Criar nova sessão
  const token = randomBytes(32).toString('hex');
  const [newSession] = await db
    .insert(responseSessions)
    .values({
      surveyId,
      userId,
      token,
      ip,
      userAgent,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      status: 'em_andamento',
    })
    .returning();

  return newSession;
};

export const upsertRespondentProfile = async (
  sessionId: number,
  profileData: Partial<Omit<InsertRespondent, 'sessionId' | 'id'>>
) => {
  const [existing] = await db
    .select({ id: respondents.id })
    .from(respondents)
    .where(eq(respondents.sessionId, sessionId));

  if (existing) {
    const [updated] = await db
      .update(respondents)
      .set(profileData)
      .where(eq(respondents.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(respondents)
    .values({ ...profileData, sessionId })
    .returning();
  return created;
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
 * Salva múltiplas respostas em uma única transação.
 * - Respostas já existentes são atualizadas.
 * - Novas respostas são inseridas.
 * - Atualiza o last_activity_at da sessão.
 *
 * @returns número de respostas afetadas (inseridas + atualizadas)
 */
export const saveAnswersBatch = async (
  sessionId: number,
  answersPayload: AnswerPayload[]
): Promise<number> => {
  if (answersPayload.length === 0) return 0;

  return await db.transaction(async (tx) => {
    // 1. Buscar IDs das perguntas para verificar quais já têm respostas
    const questionIds = answersPayload.map((a) => a.questionId);
    const existingAnswers = await tx
      .select({ questionId: answers.questionId })
      .from(answers)
      .where(and(eq(answers.sessionId, sessionId), inArray(answers.questionId, questionIds)));

    const existingQuestionIds = new Set(existingAnswers.map((e) => e.questionId));

    // 2. Separar payload em updates e inserts
    const toUpdate: AnswerPayload[] = [];
    const toInsert: AnswerPayload[] = [];

    for (const ans of answersPayload) {
      if (existingQuestionIds.has(ans.questionId)) {
        toUpdate.push(ans);
      } else {
        toInsert.push(ans);
      }
    }

    // 3. Executar updates individuais (pode ser otimizado com CASE/WHEN, mas mantemos simples)
    for (const ans of toUpdate) {
      await tx
        .update(answers)
        .set({
          value: ans.value as any, // valor já validado no controller
          answeredAt: new Date(),
        })
        .where(and(eq(answers.sessionId, sessionId), eq(answers.questionId, ans.questionId)));
    }

    // 4. Executar inserts em lote
    if (toInsert.length > 0) {
      await tx.insert(answers).values(
        toInsert.map((ans) => ({
          sessionId,
          questionId: ans.questionId,
          value: ans.value as any,
          answeredAt: new Date(),
        }))
      );
    }

    // 5. Atualizar last_activity_at da sessão
    await tx
      .update(responseSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(responseSessions.id, sessionId));

    return toUpdate.length + toInsert.length;
  });
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
  // 1. Atualiza o status da sessão (idempotente)
  await db
    .update(responseSessions)
    .set({ status: 'concluida', completedAt: new Date() })
    .where(eq(responseSessions.id, sessionId));

  // 2. Verifica se já existe respondente para esta sessão
  const [existingRespondent] = await db
    .select()
    .from(respondents)
    .where(eq(respondents.sessionId, sessionId))
    .limit(1);

  if (existingRespondent) {
    // Se já existe, retorna o existente (ignora os dados reenviados)
    return existingRespondent;
  }

  // 3. Insere novo respondente apenas se não existir
  const [newRespondent] = await db
    .insert(respondents)
    .values({
      ...respondentData,
      sessionId,
    })
    .returning();

  return newRespondent;
};

/**
 * Finaliza uma sessão de usuário autenticado, marcando-a como concluída.
 * Presume que o perfil do respondente já foi salvo.
 */
export const finalizeUserSession = async (sessionId: number) => {
  await db
    .update(responseSessions)
    .set({ status: 'concluida', completedAt: new Date() })
    .where(eq(responseSessions.id, sessionId));
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
      // return (
      //   Array.isArray(value) &&
      //   Array.isArray(options) &&
      //   value.every((v) => typeof v === 'string' && options.includes(v))
      // );
      return (
        Array.isArray(value) &&
        value.length === 1 &&
        Array.isArray(options) &&
        (options as string[]).includes(value[0] as string)
      );
    case 'multipla_escolha':
      return (
        Array.isArray(value) &&
        Array.isArray(options) &&
        value.every((v) => typeof v === 'string' && options.includes(v))
      );
    case 'texto_longo':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return true;
  }
};
