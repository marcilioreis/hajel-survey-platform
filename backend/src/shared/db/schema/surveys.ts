import { pgTable, serial, varchar, text, integer, boolean, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const surveys = pgTable('surveys', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => user.id).notNull(), // mudado para text por compatibilidade com user.id
  public: boolean('public').default(false),
  slug: varchar('slug', { length: 100 }).unique(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  active: boolean('active').default(false),
  customStyle: jsonb('custom_style'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  required: boolean('required').default(true),
  order: integer('order').notNull(),
  options: jsonb('options'),
  conditionalLogic: jsonb('conditional_logic'),
});

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  order: integer('order'),
});

// Tipos inferidos para uso nos serviços
export type Survey = InferSelectModel<typeof surveys>;
export type InsertSurvey = InferInsertModel<typeof surveys>;
export type Question = InferSelectModel<typeof questions>;
export type InsertQuestion = InferInsertModel<typeof questions>;
export type Location = InferSelectModel<typeof locations>;
export type InsertLocation = InferInsertModel<typeof locations>;