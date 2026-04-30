// src/modules/geography/geography.service.ts
import { db } from '../../shared/db/index.js';
import { neighborhoods } from '../../shared/db/schema/locations.js';
import { eq, and } from 'drizzle-orm';

export const getStates = async () => {
  const result = await db
    .selectDistinct({ state: neighborhoods.state })
    .from(neighborhoods)
    .orderBy(neighborhoods.state);
  return result.map((r) => r.state);
};

export const getMunicipalities = async (uf: string) => {
  const result = await db
    .selectDistinct({ city: neighborhoods.city })
    .from(neighborhoods)
    .where(eq(neighborhoods.state, uf))
    .orderBy(neighborhoods.city);
  return result.map((r) => r.city);
};

export const getNeighborhoods = async (city: string, uf?: string) => {
  const conditions = [eq(neighborhoods.city, city)];
  if (uf) {
    conditions.push(eq(neighborhoods.state, uf));
  }

  return await db
    .selectDistinct({
      name: neighborhoods.neighborhood,
      type: neighborhoods.type,
    })
    .from(neighborhoods)
    .where(and(...conditions))
    .orderBy(neighborhoods.neighborhood);
};
