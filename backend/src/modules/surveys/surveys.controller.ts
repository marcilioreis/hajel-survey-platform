// src/modules/surveys/surveys.controller.ts
import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';
import * as locationsService from '../locations/locations.service.js';
import { db } from '../../shared/db/index.js';
import { auditLogs } from '../../shared/db/schema/audit.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const createSurvey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { locationIds, locations, ...surveyData } = req.body;

    if (!surveyData.endDate) {
      return res.status(400).json({ error: 'endDate é obrigatória' });
    }

    const survey = await surveyService.create(surveyData, userId);

    // Associação de locais
    let items = locationIds;
    if (locations !== undefined) {
      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: 'Locations deve ser um array não vazio' });
      }
      items = locations;
    }
    if (items !== undefined) {
      const allLocations = await locationsService.getAllLocations();
      const validIds = allLocations.map((l) => l.id);
      const ids = items.map((item: any) => (typeof item === 'number' ? item : item.id));
      const invalidIds = ids.filter((id: number) => !validIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: `IDs de local inválidos: ${invalidIds.join(', ')}` });
      }
      await locationsService.setSurveyLocations(survey.id, items);
    }

    const enriched = await surveyService.findByIdEnriched(survey.id);
    res.status(201).json(enriched);

    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'survey.create',
      entityType: 'survey',
      entityId: survey.id,
      details: { title: survey.title },
      ip: req.ip,
    });
  } catch (error: unknown) {
    console.error('Create survey error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    if (message === 'Forbidden') return res.status(403).json({ error: 'Acesso negado' });
    if (message?.includes('endDate')) return res.status(400).json({ error: message });
    res.status(500).json({ error: 'Falha ao criar pesquisa' });
  }
};

export const listSurveys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const canViewAny = hasPermission(req, 'survey:view_any');
    if (canViewAny) {
      const allSurveys = await surveyService.findAllSurveys();
      return res.json(allSurveys);
    }
    const canViewOwn = hasPermission(req, 'survey:view');
    if (canViewOwn) {
      const ownSurveys = await surveyService.findAll(userId);
      return res.json(ownSurveys);
    }
    const publicSurveys = await surveyService.findPublicSurveys();
    return res.json(publicSurveys);
  } catch (error) {
    console.error('List surveys error:', error);
    res.status(500).json({ error: 'Falha ao listar pesquisas' });
  }
};

export const listSurveysEnriched = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const canViewAny = hasPermission(req, 'survey:view_any');
    if (canViewAny) {
      const allSurveys = await surveyService.findAllSurveysEnriched();
      return res.json(allSurveys);
    }
    const canViewOwn = hasPermission(req, 'survey:view');
    if (canViewOwn) {
      const ownSurveys = await surveyService.findAllEnriched(userId);
      return res.json(ownSurveys);
    }
    const publicSurveys = await surveyService.findPublicSurveysEnriched(userId);
    return res.json(publicSurveys);
  } catch (error) {
    console.error('List surveys error:', error);
    res.status(500).json({ error: 'Falha ao listar pesquisas' });
  }
};

export const getSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const survey = await surveyService.findByIdEnriched(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    }
    res.json(survey);
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ error: 'Falha ao obter pesquisa' });
  }
};

export const updateSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const userId = req.user!.id;
    const { locationIds, locations, ...surveyFields } = req.body;

    const updateData: Partial<{
      title: string;
      description: string | null;
      public: boolean;
      active: boolean;
      startDate: Date;
      endDate: Date;
    }> = {};

    if ('title' in surveyFields) updateData.title = surveyFields.title;
    if ('description' in surveyFields) updateData.description = surveyFields.description;
    if ('public' in surveyFields) updateData.public = surveyFields.public;
    if ('active' in surveyFields) updateData.active = surveyFields.active;
    if ('startDate' in surveyFields) {
      const parsed = new Date(surveyFields.startDate);
      if (isNaN(parsed.getTime()))
        return res.status(400).json({ error: 'Data de início inválida' });
      updateData.startDate = parsed;
    }
    if ('endDate' in surveyFields) {
      const parsed = new Date(surveyFields.endDate);
      if (isNaN(parsed.getTime())) return res.status(400).json({ error: 'Data inválida' });
      updateData.endDate = parsed;
    }
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        return res
          .status(400)
          .json({ error: 'Data de término precisa ser depois de data de início' });
      }
    }

    const canEditAny = hasPermission(req, 'survey:edit_any');
    const canEditOwn = hasPermission(req, 'survey:edit');
    if (!canEditAny && !canEditOwn) return res.status(403).json({ error: 'Acesso negado' });

    const survey = await surveyService.update(surveyId, updateData, userId);
    if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada' });

    let items = locationIds;
    if (locations !== undefined) {
      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: 'Locations deve ser um array não vazio' });
      }
      items = locations;
    }
    if (items !== undefined) {
      const allLocations = await locationsService.getAllLocations();
      const validIds = allLocations.map((l) => l.id);
      const ids = items.map((item: any) => (typeof item === 'number' ? item : item.id));
      const invalidIds = ids.filter((id: number) => !validIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: `IDs de local inválidos: ${invalidIds.join(', ')}` });
      }
      await locationsService.setSurveyLocations(surveyId, items);
    }

    const enriched = await surveyService.findByIdEnriched(surveyId);
    res.json(enriched);
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ error: 'Falha ao atualizar pesquisa' });
  }
};

export const deleteSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const userId = req.user!.id;

    const canDeleteAny = hasPermission(req, 'survey:delete_any');
    if (canDeleteAny) {
      await surveyService.remove(surveyId, userId);
      return res.status(204).send();
    }
    const canDeleteOwn = hasPermission(req, 'survey:delete');
    if (canDeleteOwn) {
      await surveyService.remove(surveyId, userId);
      return res.status(204).send();
    }
    return res.status(403).json({ error: 'Acesso negado' });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({ error: 'Falha ao excluir pesquisa' });
  }
};
