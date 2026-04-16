import { pgTable, serial, varchar, text, integer, boolean, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../shared/db/schema/auth';

export const surveys = pgTable('surveys', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  public: boolean('public').default(false),
  slug: varchar('slug', { length: 100 }).unique(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  active: boolean('active').default(false),
  customStyle: jsonb('custom_style'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  order: integer('order'),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id).notNull(),
  text: text('text').notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  required: boolean('required').default(true),
  order: integer('order').notNull(),
  options: jsonb('options'),
  conditionalLogic: jsonb('conditional_logic'),
});