import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { surveys, questions, locations } from '../../shared/db/schema/surveys.js';
import type {
  InsertSurvey,
  InsertQuestion,
  InsertLocation,
} from '../../shared/db/schema/surveys.js';

// userId é string porque user.id (Better Auth) é texto/UUID
export const create = async (
  data: Omit<InsertSurvey, 'createdBy' | 'createdAt'>,
  userId: string
) => {
  const [survey] = await db
    .insert(surveys)
    .values({
      ...data,
      createdBy: userId,
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

export const findById = async (id: number, userId?: string) => {
  const where = userId
    ? and(eq(surveys.id, id), eq(surveys.createdBy, userId))
    : eq(surveys.id, id);
  const [survey] = await db.select().from(surveys).where(where);
  return survey;
};

/**
 * Busca uma pesquisa pelo ID, com verificação opcional de permissão de dono.
 */
export const findByIdWithAccess = async (surveyId: number, userId?: string) => {
  const [survey] = await db.select().from(surveys).where(eq(surveys.id, surveyId));
  if (!survey) return null;

  // Se a pesquisa é pública e ativa, qualquer um pode ver (mesmo sem userId)
  if (survey.public && survey.active) {
    return survey;
  }

  // Caso contrário, apenas o dono ou admin (verificação será feita no controller)
  if (userId && survey.createdBy === userId) {
    return survey;
  }

  return null; // Acesso negado
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

// Questions
export const addQuestion = async (data: InsertQuestion) => {
  const [question] = await db.insert(questions).values(data).returning();
  return question;
};

export const getQuestions = async (surveyId: number) => {
  return db
    .select()
    .from(questions)
    .where(eq(questions.surveyId, surveyId))
    .orderBy(questions.order);
};

// Locations
export const addLocation = async (data: InsertLocation) => {
  const [location] = await db.insert(locations).values(data).returning();
  return location;
};

export const getLocations = async (surveyId: number) => {
  return db
    .select()
    .from(locations)
    .where(eq(locations.surveyId, surveyId))
    .orderBy(locations.order);
};
