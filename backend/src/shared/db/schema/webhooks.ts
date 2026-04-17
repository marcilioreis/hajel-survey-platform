// src/shared/db/schema/webhooks.ts
import { pgTable, serial, varchar, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { surveys } from './surveys.js';

export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  secret: varchar('secret', { length: 100 }),
  events: text('events').array().default(['response.completed']),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});