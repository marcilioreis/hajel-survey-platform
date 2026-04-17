// src/shared/db/schema/responses.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  inet,
} from 'drizzle-orm/pg-core';
import { surveys, questions, locations } from './surveys.js';
import { user } from './auth.js';

export const responseSessions = pgTable('response_sessions', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id')
    .references(() => surveys.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }), // alterado para text
  ip: inet('ip'),
  userAgent: text('user_agent'),
  startedAt: timestamp('started_at').defaultNow(),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  status: varchar('status', { length: 20 }).default('em_andamento'),
});

export const respondents = pgTable('respondents', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => responseSessions.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  age: integer('age'),
  ageRange: varchar('age_range', { length: 20 }),
  gender: varchar('gender', { length: 1 }),
  incomeRange: varchar('income_range', { length: 30 }),
  education: varchar('education', { length: 30 }),
  occupation: varchar('occupation', { length: 50 }),
  locationId: integer('location_id').references(() => locations.id),
  extraData: jsonb('extra_data'),
});

export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => responseSessions.id, { onDelete: 'cascade' })
    .notNull(),
  questionId: integer('question_id')
    .references(() => questions.id, { onDelete: 'cascade' })
    .notNull(),
  value: jsonb('value').notNull(),
  answeredAt: timestamp('answered_at').defaultNow(),
});
