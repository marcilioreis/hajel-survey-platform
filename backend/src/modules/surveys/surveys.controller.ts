import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const createSurvey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const survey = await surveyService.create(req.body, userId);
    res.status(201).json(survey);
  } catch (error: any) {
    if (error.message.includes('endDate')) {
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

// src/modules/surveys/surveys.controller.ts
export const updateSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const userId = req.user!.id;
    const { locations, ...surveyFields } = req.body;

    // Monta updateData apenas com campos permitidos e com tipos corretos
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
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Formato de data inválido' });
      }
      updateData.endDate = parsed;
    }

    // Valida locations (se enviado) como array de objetos
    if (locations !== undefined) {
      if (!Array.isArray(locations)) {
        return res.status(400).json({ error: 'Locations deve ser um array' });
      }
      for (const loc of locations) {
        if (!loc.name || typeof loc.name !== 'string' || loc.order == null) {
          return res.status(400).json({ error: 'Cada local precisa de name e order' });
        }
      }
    }

    // Verifica permissões
    const canEditAny = hasPermission(req, 'survey:edit_any');
    const canEditOwn = hasPermission(req, 'survey:edit');
    if (!canEditAny && !canEditOwn) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Chama o serviço (que faz atualização da pesquisa + substituição de locais em transação)
    const updatedSurvey = await surveyService.update(surveyId, updateData, userId, locations);

    // Retorna o dado enriquecido (já com locations) – sem chamada extra
    return res.json(updatedSurvey);
  } catch (error: any) {
    console.error('Update survey error:', error);
    if (error.message === 'Pesquisa não encontrada ou acesso negado') {
      return res.status(404).json({ error: error.message });
    }
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
