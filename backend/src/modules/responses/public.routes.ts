import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../../shared/redis/index.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  submitSingleAnswerSchema,
  batchAnswersSchema,
  completeSessionSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './responses.controller.js';

const publicLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:pub:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Limite de requisições excedido, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
router.use(publicLimiter);

/**
 * @openapi
 * /s/{slug}:
 *   get:
 *     summary: Visualizar uma pesquisa pública (respondente anônimo)
 *     tags: [Respostas Públicas]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados da pesquisa (sem autenticação)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicSurvey'
 *       404:
 *         description: Pesquisa não encontrada ou inativa
 */
router.get('/s/:slug', controller.getPublicSurvey);

/**
 * @openapi
 * /s/{slug}/start:
 *   post:
 *     summary: Iniciar uma nova sessão de resposta (retorna token)
 *     tags: [Respostas Públicas]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Token de sessão gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *       404:
 *         description: Pesquisa não encontrada ou inativa
 */
router.post('/s/:slug/start', controller.startSession);

/**
 * @openapi
 * /s/{token}/answers:
 *   post:
 *     summary: Enviar uma única resposta (via token de sessão)
 *     tags: [Respostas Públicas]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SingleAnswer'
 *     responses:
 *       200:
 *         description: Resposta salva
 *       400:
 *         description: Dados inválidos ou sessão expirada
 */
router.post('/s/:token/answers', validateBody(submitSingleAnswerSchema), controller.submitAnswer);

/**
 * @openapi
 * /s/{token}/answers/batch:
 *   post:
 *     summary: Enviar múltiplas respostas em lote
 *     tags: [Respostas Públicas]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/AnswerPayload'
 *     responses:
 *       200:
 *         description: Respostas salvas
 *       400:
 *         description: Dados inválidos
 */
router.post(
  '/s/:token/answers/batch',
  validateBody(batchAnswersSchema),
  controller.submitAnswerBatchWithToken
);

/**
 * @openapi
 * /s/{token}/complete:
 *   post:
 *     summary: Finalizar sessão (enviar dados demográficos)
 *     tags: [Respostas Públicas]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteSession'
 *     responses:
 *       200:
 *         description: Sessão concluída
 *       400:
 *         description: Campos obrigatórios faltando
 */
router.post('/s/:token/complete', validateBody(completeSessionSchema), controller.completeSession);

/**
 * @openapi
 * /s/{token}/progress:
 *   get:
 *     summary: Obter progresso de uma sessão
 *     tags: [Respostas Públicas]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progresso atual da sessão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 answers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AnswerPayload'
 *                 lastActivity:
 *                   type: string
 *                   format: date-time
 */
router.get('/s/:token/progress', controller.getProgress);

export default router;
