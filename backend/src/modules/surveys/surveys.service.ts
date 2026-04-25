import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { surveys, questions, locations } from '../../shared/db/schema/surveys.js';
import type { SurveyEnriched } from '../../shared/db/schema/views.types.js';
import type {
  InsertSurvey,
  InsertQuestion,
  InsertLocation,
} from '../../shared/db/schema/surveys.js';

// Função auxiliar para mapear uma linha da view para o tipo SurveyEnriched
const mapRowToSurveyEnriched = (row: Record<string, unknown>): SurveyEnriched => ({
  id: row.id as number,
  title: row.title as string,
  description: row.description as string | null,
  createdBy: row.created_by as string,
  public: row.public as boolean,
  slug: row.slug as string | null,
  startDate: row.start_date ? new Date(row.start_date as string) : null,
  endDate: new Date(row.end_date as string),
  active: row.active as boolean,
  customStyle: row.custom_style,
  createdAt: new Date(row.created_at as string),
  questions: row.questions as SurveyEnriched['questions'],
  locations: row.locations as SurveyEnriched['locations'],
  responsesCount: Number(row.responses_count) || 0,
  status: row.status as SurveyEnriched['status'],
});

// ========== PESQUISAS ==========

// userId é string porque user.id (Better Auth) é texto/UUID
export const create = async (
  data: Omit<InsertSurvey, 'createdBy' | 'createdAt' | 'startDate'>,
  userId: string
) => {
  // Define startDate como agora + 2 horas
  const startDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

  // Valida endDate
  if (!data.endDate) {
    throw new Error('endDate é obrigatória');
  }
  const endDate = new Date(data.endDate);
  if (endDate <= startDate) {
    throw new Error('endDate precisa ser depois de startDate');
  }

  const [survey] = await db
    .insert(surveys)
    .values({
      ...data,
      createdBy: userId,
      startDate,
      endDate: endDate,
    })
    .returning();
  return survey;
};

export const findAll = async (userId: string) => {
  return db
    .select()
    .from(surveys)
    .where(eq(surveys.createdBy, userId))
    .orderBy(desc(surveys.createdAt));
};
/**
 * Lista pesquisas públicas (ativas e marcadas como public).
 */
export const findPublicSurveys = async () => {
  return db
    .select()
    .from(surveys)
    .where(and(eq(surveys.active, true), eq(surveys.public, true)))
    .orderBy(desc(surveys.createdAt));
};
/**
 * Lista todas as pesquisas do sistema (uso exclusivo para administradores).
 */
export const findAllSurveys = async () => {
  return db.select().from(surveys).orderBy(desc(surveys.createdAt));
};

export const findAllEnriched = async (userId: string) => {
  const rows = await db.execute(sql`
    SELECT * FROM surveys_enriched
    WHERE created_by = ${userId}       
    ORDER BY created_at DESC
  `);
  return rows as unknown as SurveyEnriched[];
};

// Se quiser filtrar por usuário (pesquisas próprias + públicas)
export const findPublicSurveysEnriched = async (userId: string): Promise<SurveyEnriched[]> => {
  // Pesquisador: vê suas próprias + pesquisas públicas ativas
  const rows = await db.execute(sql`
    SELECT * FROM surveys_enriched
    WHERE created_by = ${userId}
       OR (public = true AND status = 'ativa')
    ORDER BY created_at DESC
  `);
  return (rows as unknown as Record<string, unknown>[]).map(mapRowToSurveyEnriched);
};

export const findAllSurveysEnriched = async (): Promise<SurveyEnriched[]> => {
  const rows = await db.execute(sql`
    SELECT * FROM surveys_enriched ORDER BY created_at DESC
  `);
  return (rows as unknown as Record<string, unknown>[]).map(mapRowToSurveyEnriched);
};

export const findById = async (id: number, userId?: string) => {
  const where = userId
    ? and(eq(surveys.id, id), eq(surveys.createdBy, userId))
    : eq(surveys.id, id);
  const [survey] = await db.select().from(surveys).where(where);
  return survey;
};

// Retorna dados enriquecidos da view
export const findByIdEnriched = async (surveyId: number): Promise<SurveyEnriched | null> => {
  const rows = await db.execute(sql`
    SELECT * FROM surveys_enriched WHERE id = ${surveyId}
  `);
  const results = rows as unknown as SurveyEnriched[];
  return results.length > 0 ? results[0] : null;
};

/**
 * Busca uma pesquisa pelo ID, com verificação opcional de permissão de dono.
 */
export const findByIdWithAccess = async (
  surveyId: number,
  userId?: string
): Promise<SurveyEnriched | null> => {
  const rows = await db.execute(sql`
    SELECT * FROM surveys_enriched WHERE id = ${surveyId}
  `);
  const results = (rows as unknown as Record<string, unknown>[]).map(mapRowToSurveyEnriched);
  const survey = results[0];
  if (!survey) return null;

  // Verifica acesso
  const isOwner = userId && survey.createdBy === userId;
  const isPublicActive = survey.public && survey.status === 'ativa';
  if (!isOwner && !isPublicActive) return null;

  return survey;
};

export const update = async (id: number, data: Partial<InsertSurvey>, userId: string) => {
  const [survey] = await db
    .update(surveys)
    .set(data)
    .where(and(eq(surveys.id, id), eq(surveys.createdBy, userId)))
    .returning();
  return survey;
};

export const remove = async (id: number, userId: string) => {
  const [deleted] = await db
    .delete(surveys)
    .where(and(eq(surveys.id, id), eq(surveys.createdBy, userId)))
    .returning();
  return deleted;
};

// ========== PERGUNTAS ==========

/**
 * Adiciona uma nova pergunta a uma pesquisa.
 * Verifica se a pesquisa existe e pertence ao usuário (ou admin).
 */
export const addQuestion = async (
  surveyId: number,
  data: Omit<InsertQuestion, 'surveyId'>,
  userId: string
) => {
  // Verifica se o usuário pode editar a pesquisa
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Acesso negado');

  const [question] = await db
    .insert(questions)
    .values({ ...data, surveyId })
    .returning();
  return question;
};
export const addQuestionsBatch = async (
  surveyId: number,
  questionsData: Omit<InsertQuestion, 'surveyId'>[],
  userId: string
) => {
  // Verifica se o usuário pode editar a pesquisa
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Forbidden');

  return await db.transaction(async (tx) => {
    const createdQuestions = await tx
      .insert(questions)
      .values(questionsData.map((q) => ({ ...q, surveyId })))
      .returning();
    return createdQuestions;
  });
};

/**
 * Lista todas as perguntas de uma pesquisa.
 * Acesso permitido se o usuário pode visualizar a pesquisa.
 */
export const getQuestions = async (surveyId: number) => {
  return db
    .select()
    .from(questions)
    .where(eq(questions.surveyId, surveyId))
    .orderBy(questions.order);
};

/**
 * Atualiza uma pergunta existente.
 */
export const updateQuestion = async (
  surveyId: number,
  questionId: number,
  data: Partial<Omit<InsertQuestion, 'surveyId' | 'id'>>,
  userId: string
) => {
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Forbidden');

  const [question] = await db
    .update(questions)
    .set(data)
    .where(and(eq(questions.id, questionId), eq(questions.surveyId, surveyId)))
    .returning();
  return question;
};

/**
 * Remove uma pergunta.
 */
export const deleteQuestion = async (surveyId: number, questionId: number, userId: string) => {
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Forbidden');

  const [deleted] = await db
    .delete(questions)
    .where(and(eq(questions.id, questionId), eq(questions.surveyId, surveyId)))
    .returning();
  return deleted;
};

// ========== LOCAIS ==========

export const addLocation = async (
  surveyId: number,
  data: Omit<InsertLocation, 'surveyId'>,
  userId: string
) => {
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Não autorizado');

  const [location] = await db
    .insert(locations)
    .values({ ...data, surveyId })
    .returning();
  return location;
};

export const getLocations = async (surveyId: number) => {
  return db
    .select()
    .from(locations)
    .where(eq(locations.surveyId, surveyId))
    .orderBy(locations.order);
};

export const getAllLocations = async () => {
  return db.select().from(locations).orderBy(locations.name);
};

export const updateLocation = async (
  surveyId: number,
  locationId: number,
  data: Partial<Omit<InsertLocation, 'surveyId' | 'id'>>,
  userId: string
) => {
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Não autorizado');

  const [location] = await db
    .update(locations)
    .set(data)
    .where(and(eq(locations.id, locationId), eq(locations.surveyId, surveyId)))
    .returning();
  return location;
};

export const deleteLocation = async (surveyId: number, locationId: number, userId: string) => {
  const [survey] = await db
    .select({ createdBy: surveys.createdBy })
    .from(surveys)
    .where(eq(surveys.id, surveyId));
  if (!survey) throw new Error('Pesquisa não encontrada');
  if (survey.createdBy !== userId) throw new Error('Não autorizado');

  const [deleted] = await db
    .delete(locations)
    .where(and(eq(locations.id, locationId), eq(locations.surveyId, surveyId)))
    .returning();
  return deleted;
};

export const getPublicSurveyBySlug = async (slug: string) => {
  const [survey] = await db
    .select({
      id: surveys.id,
      title: surveys.title,
      description: surveys.description,
      active: surveys.active,
      public: surveys.public,
      startDate: surveys.startDate,
      endDate: surveys.endDate,
      customStyle: surveys.customStyle,
    })
    .from(surveys)
    .where(and(eq(surveys.slug, slug), eq(surveys.active, true), eq(surveys.public, true)))
    .limit(1);

  if (!survey) return null;

  // Verifica período de validade
  const now = new Date();
  if (survey.startDate && new Date(survey.startDate) > now) return null;
  if (survey.endDate && new Date(survey.endDate) < now) return null;

  // Busca perguntas (ordenadas)
  const surveyQuestions = await db
    .select({
      id: questions.id,
      text: questions.text,
      type: questions.type,
      required: questions.required,
      order: questions.order,
      options: questions.options,
      conditionalLogic: questions.conditionalLogic,
    })
    .from(questions)
    .where(eq(questions.surveyId, survey.id))
    .orderBy(questions.order);

  // Busca locais
  const surveyLocations = await db
    .select({
      id: locations.id,
      name: locations.name,
      order: locations.order,
    })
    .from(locations)
    .where(eq(locations.surveyId, survey.id))
    .orderBy(locations.order);

  return {
    ...survey,
    questions: surveyQuestions,
    locations: surveyLocations,
  };
};
