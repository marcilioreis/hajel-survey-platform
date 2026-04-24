// src/modules/surveys/results.controller.ts
import { Request, Response } from 'express';
import * as resultsService from './results.service.js';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const getSurveyResults = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;

    // Verifica se a pesquisa existe e se o usuário pode vê-la
    const survey = await surveyService.findById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    // Verifica permissão de visualizar resultados agregados
    const canViewAggregated = await hasPermission(userId, 'response:view_aggregated');
    const isOwner = survey.createdBy === userId;
    const isAdmin = await hasPermission(userId, 'survey:view_any');

    if (!canViewAggregated && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      locationIds: req.query.locationIds
        ? (req.query.locationIds as string).split(',').map(Number)
        : undefined,
    };

    const results = await resultsService.getSurveyResults(surveyId, filters);
    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOpenEndedResponses = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;

    // Verifica acesso à pesquisa (igual ao getSurveyResults)
    const survey = await surveyService.findById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    const isOwner = survey.createdBy === userId;
    const isAdmin = await hasPermission(userId, 'survey:view_any');
    // Permite visualização se for dono, admin, ou a pesquisa é pública e ativa
    // (Não exigimos permissão response:view_individual)
    if (!isOwner && !isAdmin) {
      // Para usuários comuns, a pesquisa precisa estar pública e ativa
      const enriched = await surveyService.findByIdWithAccess(surveyId, userId);
      if (!enriched || enriched.status !== 'ativa') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      locationIds: req.query.locationIds
        ? (req.query.locationIds as string).split(',').map(Number)
        : undefined,
    };

    const openEnded = await resultsService.getOpenEndedResponses(surveyId, filters);
    res.json(openEnded);
  } catch (error) {
    console.error('Get open-ended responses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
