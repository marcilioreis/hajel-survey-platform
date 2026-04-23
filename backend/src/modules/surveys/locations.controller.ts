// src/modules/surveys/locations.controller.ts
import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';

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
    if (error.message === 'Não autorizado')
      return res.status(403).json({ error: 'Não autorizado' });
    if (error.message === 'Pesquisa não encontrada')
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    res.status(500).json({ error: 'Falha ao adicionar local' });
  }
};

export const listLocations = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const locations = await surveyService.getLocations(surveyId);
    res.json(locations);
  } catch (error) {
    console.error('Fetch locations error:', error);
    res.status(500).json({ error: 'Falha ao buscar locais' });
  }
};

export const listAllLocations = async (req: Request, res: Response) => {
  try {
    const allLocations = await surveyService.getAllLocations();
    res.json(allLocations);
  } catch (error) {
    console.error('Fetch locations error:', error);
    res.status(500).json({ error: 'Falha ao listar locais' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const locationId = getNumericId(req.params.locationId);
    const userId = req.user!.id;
    // Verifica se pode editar qualquer local (admin)
    const location = await surveyService.updateLocation(surveyId, locationId, req.body, userId);
    if (!location) return res.status(404).json({ error: 'Local não encontrado' });
    return res.json(location);
  } catch (error: any) {
    console.error('Update location error:', error);
    if (error.message === 'Não autorizado')
      return res.status(403).json({ error: 'Não autorizado' });
    res.status(500).json({ error: 'Falha ao atualizar local' });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const locationId = getNumericId(req.params.locationId);
    const userId = req.user!.id;

    await surveyService.deleteLocation(surveyId, locationId, userId);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Delete location error:', error);
    if (error.message === 'Não autorizado')
      return res.status(403).json({ error: 'Não autorizado' });
    res.status(500).json({ error: 'Falha ao deletar local' });
  }
};
