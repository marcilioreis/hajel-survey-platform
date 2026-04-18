// src/modules/surveys/locations.controller.ts
import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const addLocation = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;
    const location = await surveyService.addLocation(surveyId, req.body, userId);
    res.status(201).json(location);
  } catch (error: any) {
    console.error('Add location error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
    if (error.message === 'Survey not found')
      return res.status(404).json({ error: 'Survey not found' });
    res.status(500).json({ error: 'Failed to add location' });
  }
};

export const listLocations = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const locations = await surveyService.getLocations(surveyId);
    res.json(locations);
  } catch (error) {
    console.error('Fetch locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const locationId = getNumericId(req.params.locationId);
    const userId = req.user!.id;
    // Verifica se pode editar qualquer local (admin)
    const canEditAny = await hasPermission(userId, 'survey:edit_any');
    if (canEditAny) {
      const location = await surveyService.updateLocation(surveyId, locationId, req.body, userId);
      if (!location) return res.status(404).json({ error: 'Location not found' });
      return res.json(location);
    }
    // Senão, verifica se pode editar o próprio local (dono da pesquisa)
    const canEditOwn = await hasPermission(userId, 'survey:edit');
    if (canEditOwn) {
      const location = await surveyService.updateLocation(surveyId, locationId, req.body, userId);
      if (!location) return res.status(404).json({ error: 'Location not found' });
      return res.json(location);
    }

    // Se não tem permissão para editar, retorna 403
    return res.status(403).json({ error: 'Forbidden' });
  } catch (error: any) {
    console.error('Update location error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
    res.status(500).json({ error: 'Failed to update location' });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const locationId = getNumericId(req.params.locationId);
    const userId = req.user!.id;

    // Verifica se pode deletar qualquer local (admin)
    const canDeleteAny = await hasPermission(userId, 'survey:edit_any');
    if (canDeleteAny) {
      await surveyService.deleteLocation(surveyId, locationId, userId);
      return res.status(204).send();
    }
    // Senão, verifica se pode deletar o próprio local (dono da pesquisa)
    const canDeleteOwn = await hasPermission(userId, 'survey:edit');
    if (canDeleteOwn) {
      await surveyService.deleteLocation(surveyId, locationId, userId);
      return res.status(204).send();
    }

    // Se não tem permissão para deletar, retorna 403
    return res.status(403).json({ error: 'Forbidden' });
  } catch (error: any) {
    console.error('Delete location error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
    res.status(500).json({ error: 'Failed to delete location' });
  }
};
