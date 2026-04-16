import { Request, Response } from 'express';
import * as surveyService from './surveys.service';

export const createSurvey = async (req: Request, res: Response) => {
  const survey = await surveyService.create(req.body, req.user!.id);
  res.status(201).json(survey);
};

export const listSurveys = async (req: Request, res: Response) => {
  const surveys = await surveyService.findAll(req.user!.id);
  res.json(surveys);
};

// ... outros métodos