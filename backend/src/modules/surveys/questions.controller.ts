// src/modules/surveys/questions.controller.ts
import { Request, Response } from 'express';
import * as surveyService from './surveys.service.js';
import { hasPermission } from '../../shared/middleware/rbac.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

export const addQuestion = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;
    const question = await surveyService.addQuestion(surveyId, req.body, userId);
    res.status(201).json(question);
  } catch (error: any) {
    console.error('Add question error:', error);

    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Acesso negado' });
    if (error.message === 'Survey not found')
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    res.status(500).json({ error: 'Falha ao adicionar pergunta' });
  }
};

export const listQuestions = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const questions = await surveyService.getQuestions(surveyId);
    res.json(questions);
  } catch (error) {
    console.error('List questions error:', error);
    res.status(500).json({ error: 'Falha ao buscar perguntas' });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const questionId = getNumericId(req.params.questionId);
    const userId = req.user!.id;

    // Verifica se pode editar qualquer pergunta (admin)
    const canEditAny = await hasPermission(userId, 'survey:edit_any');
    if (canEditAny) {
      const question = await surveyService.updateQuestion(surveyId, questionId, req.body, userId);
      if (!question) return res.status(404).json({ error: 'Pergunta não encontrada' });
      return res.json(question);
    }
    // Senão, verifica se pode editar a própria pergunta (dono da pesquisa)
    const canEditOwn = await hasPermission(userId, 'survey:edit');
    if (canEditOwn) {
      const question = await surveyService.updateQuestion(surveyId, questionId, req.body, userId);
      if (!question) return res.status(404).json({ error: 'Pergunta não encontrada' });
      return res.json(question);
    }

    // Se não tem permissão para editar, retorna 403
    return res.status(403).json({ error: 'Acesso negado' });
  } catch (error: any) {
    console.error('Update question error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Acesso negado' });
    res.status(500).json({ error: 'Falha ao atualizar pergunta' });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const questionId = getNumericId(req.params.questionId);
    const userId = req.user!.id;

    // Verifica se pode deletar qualquer pergunta (admin)
    const canDeleteAny = await hasPermission(userId, 'survey:edit_any');
    if (canDeleteAny) {
      await surveyService.deleteQuestion(surveyId, questionId, userId);
      return res.status(204).send();
    }
    // Senão, verifica se pode deletar a própria pergunta (dono da pesquisa)
    const canDeleteOwn = await hasPermission(userId, 'survey:edit');
    if (canDeleteOwn) {
      await surveyService.deleteQuestion(surveyId, questionId, userId);
      return res.status(204).send();
    }

    // Se não tem permissão para deletar, retorna 403
    return res.status(403).json({ error: 'Acesso negado' });
  } catch (error: any) {
    console.error('Delete question error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Acesso negado' });
    res.status(500).json({ error: 'Falha ao excluir pergunta' });
  }
};
