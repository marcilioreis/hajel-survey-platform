// src/modules/locations/locations.service.ts
import { db } from '../../shared/db/index.js';
import { locationCatalog, surveyLocations } from '../../shared/db/schema/locations.js';
import { eq } from 'drizzle-orm';

export const getAllLocations = async () => {
  return db.select().from(locationCatalog).orderBy(locationCatalog.name);
};

export const getLocationById = async (id: number) => {
  const [loc] = await db.select().from(locationCatalog).where(eq(locationCatalog.id, id));
  return loc;
};

export const createLocation = async (data: {
  name: string;
  notes?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  cep?: string;
  address?: string;
  ibgeCode?: string;
}) => {
  const [loc] = await db.insert(locationCatalog).values(data).returning();
  return loc;
};

export const updateLocation = async (
  id: number,
  data: Partial<{
    name: string;
    notes: string;
    state: string;
    city: string;
    neighborhood: string;
    cep: string;
    address: string;
    ibgeCode: string;
  }>
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
  // Verifica associação com surveys antes de excluir? (não implementado aqui)
  await db.delete(locationCatalog).where(eq(locationCatalog.id, id));
};

export const getSurveyLocations = async (surveyId: number) => {
  return db
    .select({
      id: locationCatalog.id,
      name: locationCatalog.name,
      order: surveyLocations.order,
    })
    .from(surveyLocations)
    .innerJoin(locationCatalog, eq(surveyLocations.locationId, locationCatalog.id))
    .where(eq(surveyLocations.surveyId, surveyId))
    .orderBy(surveyLocations.order);
};

/**
 * Substitui todas as associações de locais de uma pesquisa.
 * @param items Pode ser um array de números (locationIds) ou um array de objetos { id, order? }.
 *             A ordem final será determinada pelo campo `order` de cada objeto (se presente) ou pela posição no array.
 */
export const setSurveyLocations = async (
  surveyId: number,
  items: number[] | { id: number; order?: number }[]
) => {
  // Normaliza para array de { id, order }
  const entries: { id: number; order: number }[] = [];
  if (items.length > 0) {
    if (typeof items[0] === 'number') {
      (items as number[]).forEach((id, index) => entries.push({ id, order: index + 1 }));
    } else {
      (items as { id: number; order?: number }[]).forEach((item, index) => {
        entries.push({ id: item.id, order: item.order ?? index + 1 });
      });
    }
  }

  return await db.transaction(async (tx) => {
    await tx.delete(surveyLocations).where(eq(surveyLocations.surveyId, surveyId));
    if (entries.length > 0) {
      await tx.insert(surveyLocations).values(
        entries.map((e) => ({
          surveyId,
          locationId: e.id,
          order: e.order,
        }))
      );
    }
  });
};
