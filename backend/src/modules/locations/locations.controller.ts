// src/modules/locations/locations.controller.ts
import { Request, Response } from 'express';
import * as locationsService from './locations.service.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const listAll = async (req: Request, res: Response) => {
  try {
    const locations = await locationsService.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error('List locations error:', error);
    res.status(500).json({ error: 'Falha ao listar locais' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, notes, state, city, neighborhood, cep, address, ibgeCode } = req.body;
    const location = await locationsService.createLocation(
      name,
      notes,
      state,
      city,
      neighborhood,
      cep,
      address,
      ibgeCode
    );
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Falha ao criar local' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    const updateData: Partial<{ name: string; notes: string }> = {};
    if ('name' in req.body) updateData.name = req.body.name;
    if ('notes' in req.body) updateData.notes = req.body.notes;

    const location = await locationsService.updateLocation(id, updateData);
    if (!location) return res.status(404).json({ error: 'Local não encontrado' });
    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Falha ao atualizar local' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    await locationsService.deleteLocation(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Falha ao deletar local' });
  }
};
