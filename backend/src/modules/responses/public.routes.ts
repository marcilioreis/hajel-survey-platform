// src/modules/responses/public.routes.ts
import { Router } from 'express';
import * as controller from './responses.controller.js';

const router = Router();

// Visualizar pesquisa pública
router.get('/s/:slug', controller.getPublicSurvey);

// Iniciar sessão
router.post('/s/:slug/start', controller.startSession);

// Enviar resposta (token na URL)
router.post('/s/:token/answers', controller.submitAnswer);

// Enviar respostas em lote (token na URL)
router.post('/s/:token/answers/batch', controller.submitAnswerBatchWithToken);

// Finalizar sessão
router.post('/s/:token/complete', controller.completeSession);

// Obter progresso (opcional)
router.get('/s/:token/progress', controller.getProgress);

export default router;
