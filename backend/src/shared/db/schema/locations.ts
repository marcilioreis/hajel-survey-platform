import {
  pgTable,
  serial,
  text,
  integer,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { surveys } from './index.js';

export const locationCatalog = pgTable('location_catalog', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  notes: text('notes'),
  state: varchar('state', { length: 2 }),
  city: varchar('city', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  cep: varchar('cep', { length: 10 }),
  address: text('address'),
  ibgeCode: varchar('ibge_code', { length: 7 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const surveyLocations = pgTable(
  'survey_locations',
  {
    surveyId: integer('survey_id').references(() => surveys.id, { onDelete: 'cascade' }),
    locationId: integer('location_id').references(() => locationCatalog.id, {
      onDelete: 'cascade',
    }),
    order: integer('order').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.surveyId, table.locationId] }),
  })
);

// src/shared/db/schema/locations.ts
export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  ibgeCode: varchar('ibge_code', { length: 7 }),
  neighborhood: varchar('neighborhood', { length: 150 }).notNull(),
  type: varchar('type', { length: 20 }), // novo campo
});
