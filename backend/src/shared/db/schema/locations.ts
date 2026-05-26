// src/shared/db/schema/locations.ts
import {
  pgTable,
  serial,
  text,
  integer,
  varchar,
  timestamp,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';
import { surveys } from './surveys.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const locationCatalog = pgTable('location_catalog', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  notes: text('notes'),
  state: varchar('state', { length: 2 }),
  city: jsonb('city').$type<string[]>().default([]),
  neighborhood: jsonb('neighborhood').$type<string[]>().default([]),
  cep: varchar('cep', { length: 10 }),
  address: text('address'),
  ibgeCode: varchar('ibge_code', { length: 7 }),
  studiedUniverse: text('studied_universe').notNull().default('Teste'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const surveyLocations = pgTable(
  'survey_locations',
  {
    surveyId: integer('survey_id')
      .references(() => surveys.id, { onDelete: 'cascade' })
      .notNull(),
    locationId: integer('location_id')
      .references(() => locationCatalog.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull().default(1),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.surveyId, table.locationId] }),
  })
);

export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  ibgeCode: varchar('ibge_code', { length: 7 }),
  neighborhood: varchar('neighborhood', { length: 150 }).notNull(),
  type: varchar('type', { length: 20 }),
});

export type LocationCatalog = InferSelectModel<typeof locationCatalog>;
export type InsertLocationCatalog = InferInsertModel<typeof locationCatalog>;
export type SurveyLocation = InferSelectModel<typeof surveyLocations>;
export type InsertSurveyLocation = InferInsertModel<typeof surveyLocations>;
export type Neighborhood = InferSelectModel<typeof neighborhoods>;
export type InsertNeighborhood = InferInsertModel<typeof neighborhoods>;
