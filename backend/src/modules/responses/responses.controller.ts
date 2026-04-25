// src/modules/responses/responses.controller.ts
import { Request, Response } from 'express';
import * as surveyService from '../surveys/surveys.service.js';
import * as responseService from './responses.service.js';

// Helper para extrair string de parâmetro
const getStringParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

// ========== PESQUISA PÚBLICA ==========

export const getPublicSurvey = async (req: Request, res: Response) => {
  try {
    const slug = getStringParam(req.params.slug);
    const survey = await surveyService.getPublicSurveyBySlug(slug);
    if (!survey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada ou inativa' });
    }
    res.json(survey);
  } catch (error) {
    console.error('Get public survey error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ========== INICIAR SESSÃO ==========

export const startSession = async (req: Request, res: Response) => {
  try {
    const slug = getStringParam(req.params.slug);
    const survey = await surveyService.getPublicSurveyBySlug(slug);
    if (!survey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada ou inativa' });
    }

    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const session = await responseService.startSession(survey.id, ip, userAgent);

    res.status(201).json({
      token: session.token,
      expiresIn: 24 * 60 * 60, // 24 horas em segundos
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ========== ENVIAR RESPOSTAS ==========

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const token = getStringParam(req.params.token);
    const { questionId, value } = req.body;

    const session = await responseService.getSessionByToken(token);
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada ou expirada' });
    }
    if (session.status !== 'em_andamento') {
      return res.status(400).json({ error: 'Sessão já finalizada ou abandonada' });
    }

    // Busca a pergunta validando que pertence à pesquisa da sessão (via serviço)
    const question = await responseService.getQuestionForSession(session.id, questionId);
    if (!question) {
      return res.status(400).json({ error: 'Pergunta inválida para esta pesquisa' });
    }

    // Valida a resposta
    if (!responseService.validateAnswer(question.type, value, question.options)) {
      return res.status(400).json({ error: 'Formato de resposta inválido' });
    }

    const answer = await responseService.saveAnswer(session.id, questionId, value);
    await responseService.touchSession(session.id);

    res.json({ success: true, answer });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const submitAnswerBatchWithToken = async (req: Request, res: Response) => {
  try {
    const token = getStringParam(req.params.token);
    const payload = req.body as responseService.AnswerPayload[];

    // Validação inicial
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ error: 'Payload deve ser um array não vazio' });
    }

    // Validar token e sessão
    const session = await responseService.getSessionByToken(token);
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada ou expirada' });
    }
    if (session.status !== 'em_andamento') {
      return res.status(400).json({ error: 'Sessão já finalizada ou abandonada' });
    }

    // Validar cada resposta individualmente
    const validationErrors: string[] = [];
    for (const ans of payload) {
      // Verificar se a pergunta pertence à pesquisa da sessão
      const question = await responseService.getQuestionForSession(session.id, ans.questionId);
      if (!question) {
        validationErrors.push(`Pergunta inválida: ${ans.questionId}`);
        continue;
      }
      // Validar formato da resposta
      if (!responseService.validateAnswer(question.type, ans.value, question.options)) {
        validationErrors.push(`Formato de resposta inválido para a pergunta ${ans.questionId}`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validação falhou', details: validationErrors });
    }

    // Salvar em lote
    const affectedCount = await responseService.saveAnswersBatch(session.id, payload);

    res.json({ success: true, count: affectedCount });
  } catch (error) {
    console.error('Submit answer batch error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const submitAuthenticatedResponses = async (req: Request, res: Response) => {
  try {
    const surveyId = getNumericId(req.params.surveyId);
    const userId = req.user!.id;
    const { answers, respondent } = req.body as {
      answers: responseService.AnswerPayload[];
      respondent?: {
        ageRange?: string;
        gender?: string;
        incomeRange?: string;
        education?: string;
        occupation?: string;
        locationId?: number;
      };
    };

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Respostas devem ser um array não vazio' });
    }

    // Verificar pesquisa e acesso
    const survey = await surveyService.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    }

    const isPublicActive = survey.public && survey.active;
    const isOwner = survey.createdBy === userId;
    const isAdmin = req.isAdmin;
    if (!isPublicActive && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar período
    const now = new Date();
    if (survey.startDate && new Date(survey.startDate) > now) {
      return res.status(400).json({ error: 'Pesquisa ainda não começou' });
    }
    if (survey.endDate && new Date(survey.endDate) < now) {
      return res.status(400).json({ error: 'Pesquisa já encerrada' });
    }

    // Validar locationId se fornecido
    if (respondent?.locationId) {
      const locations = await surveyService.getLocations(surveyId);
      const locationExists = locations.some((loc) => loc.id === respondent.locationId);
      if (!locationExists) {
        return res.status(400).json({ error: 'Localização inválida' });
      }
    }

    // Obter/criar sessão do usuário
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const session = await responseService.getOrCreateUserSession(surveyId, userId, ip, userAgent);

    if (session.status !== 'em_andamento') {
      return res.status(400).json({ error: 'Sessão não está ativa' });
    }

    // Validar respostas
    const validationErrors: string[] = [];
    for (const ans of answers) {
      const question = await responseService.getQuestionForSession(session.id, ans.questionId);
      if (!question) {
        validationErrors.push(`Id da pergunta inválido: ${ans.questionId}`);
        continue;
      }
      if (!responseService.validateAnswer(question.type, ans.value, question.options)) {
        validationErrors.push(`Formato de resposta inválido para a pergunta ${ans.questionId}`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validação falhou', details: validationErrors });
    }

    // Salvar respostas
    const affectedAnswers = await responseService.saveAnswersBatch(session.id, answers);

    // Salvar perfil (se enviado)
    let profileUpdated = false;
    if (respondent) {
      await responseService.upsertRespondentProfile(session.id, respondent);
      profileUpdated = true;
    }

    // Finalizar a sessão automaticamente
    await responseService.finalizeUserSession(session.id);

    res.json({
      success: true,
      answersSaved: affectedAnswers,
      profileUpdated,
      sessionCompleted: true,
    });
  } catch (error) {
    console.error('Submit authenticated responses error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ========== FINALIZAR SESSÃO ==========

export const completeSession = async (req: Request, res: Response) => {
  try {
    const token = getStringParam(req.params.token);
    const respondentData = req.body;

    const session = await responseService.getSessionByToken(token);
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada ou expirada' });
    }
    if (session.status !== 'em_andamento') {
      return res.status(400).json({ error: 'Sessão já finalizada ou abandonada' });
    }

    // Validação básica dos campos obrigatórios
    const requiredFields = [
      'ageRange',
      'gender',
      'incomeRange',
      'education',
      'occupation',
      'locationId',
    ];
    for (const field of requiredFields) {
      if (respondentData[field] === undefined) {
        return res.status(400).json({ error: `Campo obrigatório ausente: ${field}` });
      }
    }

    const respondent = await responseService.completeSession(session.id, respondentData);
    res.json({
      success: true,
      message: 'Pesquisa concluída. Obrigado!',
      respondentId: respondent.id,
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ========== PROGRESSO ==========

export const getProgress = async (req: Request, res: Response) => {
  try {
    const token = getStringParam(req.params.token);
    const session = await responseService.getSessionByToken(token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const answers = await responseService.getAnswersBySession(session.id);
    res.json({
      status: session.status,
      answers: answers.map((a) => ({ questionId: a.questionId, value: a.value })),
      lastActivity: session.lastActivityAt,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
