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

export const addQuestionsBatch = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;
    console.info('req.body', req.body);
    const questions = await surveyService.addQuestionsBatch(surveyId, req.body, userId);
    res.status(201).json(questions);
  } catch (error: any) {
    console.error('Batch add questions error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Acesso negado' });
    if (error.message === 'Pesquisa não encontrada')
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    res.status(500).json({ error: 'Falha ao adicionar perguntas em lote' });
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

    // Verifica permissão
    const canEditAny = hasPermission(req, 'survey:edit_any');
    const canEditOwn = hasPermission(req, 'survey:edit');
    if (!canEditAny && !canEditOwn) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Monta apenas campos enviados
    const updateData: Partial<{
      text: string;
      type: string;
      required: boolean;
      order: number;
      options: unknown;
      conditionalLogic: unknown;
    }> = {};

    if ('text' in req.body) updateData.text = req.body.text;
    if ('type' in req.body) updateData.type = req.body.type;
    if ('required' in req.body) updateData.required = req.body.required;
    if ('order' in req.body) updateData.order = req.body.order;
    if ('options' in req.body) updateData.options = req.body.options;
    if ('conditionalLogic' in req.body) updateData.conditionalLogic = req.body.conditionalLogic;

    const question = await surveyService.updateQuestion(surveyId, questionId, updateData, userId);
    if (!question) return res.status(404).json({ error: 'Pergunta não encontrada' });
    return res.json(question);
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

    const canDeleteAny = hasPermission(req, 'survey:delete_any');
    const canDeleteOwn = hasPermission(req, 'survey:delete');
    if (!canDeleteAny && !canDeleteOwn) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    await surveyService.deleteQuestion(surveyId, questionId, userId);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Delete question error:', error);
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Acesso negado' });
    res.status(500).json({ error: 'Falha ao excluir pergunta' });
  }
};
