import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';

// Helper para obter o id de forma segura
const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const createSurvey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const survey = await surveyService.create(req.body, userId);
    res.status(201).json(survey);
  } catch (error) {
    res.status(500).json({ error: `Failed to create survey: ${error}` });
  }
};

export const listSurveys = async (req: Request, res: Response) => {
  const surveys = await surveyService.findAll(req.user!.id);
  res.json(surveys);
};

export const getSurvey = async (req: Request, res: Response) => {
  const id = getNumericId(req.params.id);
  const survey = await surveyService.findById(id, req.user!.id);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });
  res.json(survey);
};

export const updateSurvey = async (req: Request, res: Response) => {
  const id = getNumericId(req.params.id);
  const survey = await surveyService.update(id, req.body, req.user!.id);
  res.json(survey);
};

export const deleteSurvey = async (req: Request, res: Response) => {
  const id = getNumericId(req.params.id);
  await surveyService.remove(id, req.user!.id);
  res.status(204).send();
};
