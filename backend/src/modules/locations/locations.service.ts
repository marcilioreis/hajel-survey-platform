// src/modules/locations/locations.service.ts
import { db } from '../../shared/db/index.js';
import { locationCatalog, surveyLocations } from '../../shared/db/schema/locations.js';
import { eq } from 'drizzle-orm';

// Catálogo global
export const getAllLocations = async () => {
  return db.select().from(locationCatalog).orderBy(locationCatalog.name);
};

export const getLocationById = async (id: number) => {
  const [loc] = await db.select().from(locationCatalog).where(eq(locationCatalog.id, id));
  return loc;
};

export const createLocation = async (
  name: string,
  notes?: string,
  state?: string,
  city?: string,
  neighborhood?: string,
  cep?: string,
  address?: string,
  ibgeCode?: string
) => {
  const [loc] = await db
    .insert(locationCatalog)
    .values({
      name,
      notes,
      state,
      city,
      neighborhood,
      cep,
      address,
      ibgeCode,
    })
    .returning();
  return loc;
};

export const updateLocation = async (
  id: number,
  data: Partial<{ name: string; notes: string }>
) => {
  if (Object.keys(data).length === 0) return null;
  const [loc] = await db
    .update(locationCatalog)
    .set(data)
    .where(eq(locationCatalog.id, id))
    .returning();
  return loc;
};

export const deleteLocation = async (id: number) => {
  // Verifica se existe associação com surveys
  const [assoc] = await db
    .select()
    .from(surveyLocations)
    .where(eq(surveyLocations.locationId, id))
    .limit(1);
  if (assoc) {
    throw new Error('O local está associado a uma ou mais pesquisas e não pode ser excluído.');
  }
  await db.delete(locationCatalog).where(eq(locationCatalog.id, id));
};

// Associação com pesquisas
export const getSurveyLocations = async (surveyId: number) => {
  return db
    .select({
      id: locationCatalog.id,
      name: locationCatalog.name,
      notes: locationCatalog.notes,
      order: surveyLocations.order,
    })
    .from(surveyLocations)
    .innerJoin(locationCatalog, eq(surveyLocations.locationId, locationCatalog.id))
    .where(eq(surveyLocations.surveyId, surveyId))
    .orderBy(surveyLocations.order);
};

export const setSurveyLocations = async (surveyId: number, locationIds: number[]) => {
  return await db.transaction(async (tx) => {
    await tx.delete(surveyLocations).where(eq(surveyLocations.surveyId, surveyId));
    if (locationIds.length > 0) {
      const inserts = locationIds.map((locId, index) => ({
        surveyId,
        locationId: locId,
        order: index + 1,
      }));
      await tx.insert(surveyLocations).values(inserts);
    }
  });
};
