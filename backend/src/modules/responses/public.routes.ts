// src/modules/responses/public.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../../shared/redis/index.js'; // importe a instância do Redis
import { validateBody } from '../../shared/middleware/validate.js';
import {
  submitSingleAnswerSchema,
  batchAnswersSchema,
  completeSessionSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './responses.controller.js';

// Cria uma instância local do publicLimiter (pode importar do app.ts ou criar aqui)
const publicLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:pub:', // mesmo prefixo do app
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Limite de requisições excedido, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Aplica o publicLimiter a TODAS as rotas deste roteador
router.use(publicLimiter);

// Visualizar pesquisa pública
router.get('/s/:slug', controller.getPublicSurvey);

// Iniciar sessão
router.post('/s/:slug/start', controller.startSession);

// Enviar resposta (token na URL)
router.post('/s/:token/answers', validateBody(submitSingleAnswerSchema), controller.submitAnswer);

// Enviar respostas em lote (token na URL)
router.post(
  '/s/:token/answers/batch',
  validateBody(batchAnswersSchema),
  controller.submitAnswerBatchWithToken
);

// Finalizar sessão
router.post('/s/:token/complete', validateBody(completeSessionSchema), controller.completeSession);

// Obter progresso (opcional)
router.get('/s/:token/progress', controller.getProgress);

export default router;
