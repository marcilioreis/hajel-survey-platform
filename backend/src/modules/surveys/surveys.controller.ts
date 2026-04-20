import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';

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
  } catch (error: any) {
    if (error.message.includes('endDate')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Falha ao criar pesquisa' });
  }
};

// Qualquer usuario autenticado pode listar as pesquisas.
export const listSurveysByUserId = async (req: Request, res: Response) => {
  const surveys = await surveyService.findAll(req.user!.id);
  res.json(surveys);
};
export const listSurveys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Verifica se o usuário pode ver todas as pesquisas
    const canViewAny = await hasPermission(userId, 'survey:view_any');
    if (canViewAny) {
      const allSurveys = await surveyService.findAllSurveys();
      return res.json(allSurveys);
    }

    // 2. Verifica se pode ver as próprias pesquisas
    const canViewOwn = await hasPermission(userId, 'survey:view');
    if (canViewOwn) {
      const ownSurveys = await surveyService.findAll(userId);
      return res.json(ownSurveys);
    }

    // 3. Se não tem nenhuma permissão, retorna apenas pesquisas públicas (se aplicável)
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

    // 1. Verifica se o usuário pode ver todas as pesquisas
    const canViewAny = await hasPermission(userId, 'survey:view_any');
    if (canViewAny) {
      const allSurveys = await surveyService.findAllSurveysEnriched();
      return res.json(allSurveys);
    }

    // 2. Verifica se pode ver as próprias pesquisas
    const canViewOwn = await hasPermission(userId, 'survey:view');
    if (canViewOwn) {
      const ownSurveys = await surveyService.findAllEnriched(userId);
      return res.json(ownSurveys);
    }

    // 3. Se não tem nenhuma permissão, retorna apenas pesquisas públicas (se aplicável)
    const publicSurveys = await surveyService.findPublicSurveysEnriched(userId);
    return res.json(publicSurveys);
  } catch (error) {
    console.error('List surveys error:', error);
    res.status(500).json({ error: 'Falha ao listar pesquisas' });
  }
};

// Qualquer usuário autenticado pode visualizar uma pesquisa específica.
export const getSurveyById = async (req: Request, res: Response) => {
  const id = getNumericId(req.params.id);
  const survey = await surveyService.findById(id, req.user!.id);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });
  res.json(survey);
};
export const getSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const userId = req.user?.id; // pode ser undefined se a rota for pública

    const survey = await surveyService.findByIdWithAccess(surveyId, userId);
    if (!survey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada ou acesso negado' });
    }

    res.json(survey);
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ error: 'Falha ao obter pesquisa' });
  }
};

// Qualquer usuário autenticado pode atualizar ou excluir uma pesquisa.
export const updateSurveyById = async (req: Request, res: Response) => {
  const id = getNumericId(req.params.id);
  const survey = await surveyService.update(id, req.body, req.user!.id);
  res.json(survey);
};
export const updateSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const userId = req.user!.id;

    // Verifica se pode editar qualquer pesquisa
    const canEditAny = await hasPermission(userId, 'survey:edit_any');
    if (canEditAny) {
      const survey = await surveyService.update(surveyId, req.body, userId);
      return res.json(survey);
    }

    // Verifica se pode editar apenas as próprias
    const canEditOwn = await hasPermission(userId, 'survey:edit');
    if (canEditOwn) {
      const survey = await surveyService.update(surveyId, req.body, userId);
      return res.json(survey);
    }

    return res.status(403).json({ error: 'Acesso negado' });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ error: 'Falha ao atualizar pesquisa' });
  }
};

// Qualquer usuário autenticado pode atualizar ou excluir uma pesquisa.
export const deleteSurveyById = async (req: Request, res: Response) => {
  const id = getNumericId(req.params.id);
  await surveyService.remove(id, req.user!.id);
  res.status(204).send();
};
export const deleteSurvey = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.id);
    const userId = req.user!.id;

    // Verifica se pode deletar qualquer pesquisa
    const canDeleteAny = await hasPermission(userId, 'survey:delete_any');
    if (canDeleteAny) {
      await surveyService.remove(surveyId, userId);
      return res.status(204).send();
    }

    // Verifica se pode deletar apenas as próprias
    const canDeleteOwn = await hasPermission(userId, 'survey:delete');
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
