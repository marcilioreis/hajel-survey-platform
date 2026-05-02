import { Router } from 'express';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  batchCreateQuestionsSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './questions.controller.js';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/surveys/{surveyId}/questions:
 *   post:
 *     summary: Adicionar uma pergunta a uma pesquisa
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestion'
 *     responses:
 *       201:
 *         description: Pergunta criada
 *       403:
 *         description: Acesso negado
 */
router.post(
  '/',
  authorize('survey:edit'),
  validateBody(createQuestionSchema),
  controller.addQuestion
);

/**
 * @openapi
 * /api/surveys/{surveyId}/questions/batch:
 *   post:
 *     summary: Adicionar perguntas em lote
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateQuestion'
 *     responses:
 *       201:
 *         description: Perguntas criadas
 *       403:
 *         description: Acesso negado
 */
router.post(
  '/batch',
  authorize('survey:edit'),
  validateBody(batchCreateQuestionsSchema),
  controller.addQuestionsBatch
);

/**
 * @openapi
 * /api/surveys/{surveyId}/questions:
 *   get:
 *     summary: Listar todas as perguntas de uma pesquisa
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de perguntas
 */
router.get('/', authorize('survey:view'), controller.listQuestions);

/**
 * @openapi
 * /api/surveys/{surveyId}/questions/{questionId}:
 *   put:
 *     summary: Atualizar uma pergunta
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuestion'
 *     responses:
 *       200:
 *         description: Pergunta atualizada
 *       404:
 *         description: Pergunta não encontrada
 */
router.put(
  '/:questionId',
  authorize('survey:edit'),
  validateBody(updateQuestionSchema),
  controller.updateQuestion
);

/**
 * @openapi
 * /api/surveys/{surveyId}/questions/{questionId}:
 *   delete:
 *     summary: Excluir uma pergunta
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Pergunta excluída
 */
router.delete('/:questionId', authorize('survey:edit'), controller.deleteQuestion);

export default router;
