import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';
import * as locationsService from '../locations/locations.service.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const createSurvey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { locationIds, ...surveyData } = req.body;

    // Validações de negócio (endDate já é validado pelo Zod, mas garantimos aqui)
    if (!surveyData.endDate) {
      return res.status(400).json({ error: 'endDate é obrigatória' });
    }

    // Cria a pesquisa
    const survey = await surveyService.create(surveyData, userId);

    // Se locationIds foram enviados, associa os locais
    if (locationIds !== undefined) {
      // Valida se os IDs existem (opcional, mas recomendado)
      const allLocations = await locationsService.getAllLocations();
      const validIds = allLocations.map((l) => l.id);
      const invalidIds = locationIds.filter((id: number) => !validIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: `IDs de local inválidos: ${invalidIds.join(', ')}` });
      }
      await locationsService.setSurveyLocations(survey.id, locationIds);
    }

    // Retorna a pesquisa enriquecida
    const enriched = await surveyService.findByIdEnriched(survey.id);
    res.status(201).json(enriched);
  } catch (error: any) {
    console.error('Create survey error:', error);
    if (error.message?.includes('endDate')) {
      return res.status(400).json({ error: error.message });
    }
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
    const { locationIds, ...surveyFields } = req.body;

    // Monta updateData com campos permitidos
    const updateData: Partial<{
      title: string;
      description: string | null;
      public: boolean;
      active: boolean;
      endDate: Date;
    }> = {};

    if ('title' in surveyFields) updateData.title = surveyFields.title;
    if ('description' in surveyFields) updateData.description = surveyFields.description;
    if ('public' in surveyFields) updateData.public = surveyFields.public;
    if ('active' in surveyFields) updateData.active = surveyFields.active;
    if ('endDate' in surveyFields) {
      const parsed = new Date(surveyFields.endDate);
      if (isNaN(parsed.getTime())) return res.status(400).json({ error: 'Data inválida' });
      updateData.endDate = parsed;
    }

    // Permissões
    const canEditAny = hasPermission(req, 'survey:edit_any');
    const canEditOwn = hasPermission(req, 'survey:edit');
    if (!canEditAny && !canEditOwn) return res.status(403).json({ error: 'Acesso negado' });

    // Atualiza campos básicos da pesquisa
    const survey = await surveyService.update(surveyId, updateData, userId);
    if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada' });

    // Se locationIds enviados, substitui associações
    if (locationIds !== undefined) {
      const allLocations = await locationsService.getAllLocations();
      const validIds = allLocations.map((l) => l.id);
      const invalidIds = locationIds.filter((id: number) => !validIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: `IDs de local inválidos: ${invalidIds.join(', ')}` });
      }
      await locationsService.setSurveyLocations(surveyId, locationIds);
    }

    // Retorna a pesquisa enriquecida
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
