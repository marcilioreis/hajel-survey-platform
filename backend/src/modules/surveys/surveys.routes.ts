// src/modules/surveys/surveys.routes.ts
import { Router } from 'express';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  authenticatedResponsesSchema,
  createSurveySchema,
  exportRequestSchema,
  updateSurveySchema,
} from '../../shared/validation/schemas.js';
import questionRoutes from './questions.routes.js';
import * as controller from './surveys.controller.js';
import * as responsesController from '../responses/responses.controller.js';
import * as resultsController from './results.controller.js';
import * as reportsController from './reports.controller.js';

const router = Router();

/**
 * @openapi
 * /api/surveys:
 *   post:
 *     summary: Criar uma nova pesquisa
 *     tags: [Surveys]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSurvey'
 *     responses:
 *       201:
 *         description: Pesquisa criada (enriquecida)
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 */
router.post(
  '/',
  authorize('survey:create'),
  validateBody(createSurveySchema),
  controller.createSurvey
);

/**
 * @openapi
 * /api/surveys:
 *   get:
 *     summary: Listar pesquisas acessíveis ao usuário (formato enriquecido)
 *     tags: [Surveys]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de pesquisas enriquecidas
 */
router.get('/', controller.listSurveysEnriched);

/**
 * @openapi
 * /api/surveys/{id}:
 *   get:
 *     summary: Obter uma pesquisa específica (enriquecida)
 *     tags: [Surveys]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pesquisa encontrada
 *       404:
 *         description: Pesquisa não encontrada
 */
router.get('/:id', controller.getSurvey);

/**
 * @openapi
 * /api/surveys/{id}:
 *   put:
 *     summary: Atualizar uma pesquisa
 *     tags: [Surveys]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSurvey'
 *     responses:
 *       200:
 *         description: Pesquisa atualizada (enriquecida)
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Pesquisa não encontrada
 */
router.put(
  '/:id',
  authorize({ any: ['survey:edit', 'survey:edit_any'] }),
  validateBody(updateSurveySchema),
  controller.updateSurvey
);

/**
 * @openapi
 * /api/surveys/{id}:
 *   delete:
 *     summary: Excluir uma pesquisa
 *     tags: [Surveys]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Pesquisa excluída
 *       403:
 *         description: Sem permissão
 */
router.delete(
  '/:id',
  authorize({ any: ['survey:delete', 'survey:delete_any'] }),
  controller.deleteSurvey
);

/**
 * @openapi
 * /api/surveys/{surveyId}/responses:
 *   post:
 *     summary: Submeter respostas (usuário autenticado)
 *     tags: [Respostas Autenticadas]
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
 *             $ref: '#/components/schemas/AuthenticatedResponses'
 *     responses:
 *       200:
 *         description: Respostas salvas e sessão finalizada
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.post(
  '/:surveyId/responses',
  validateBody(authenticatedResponsesSchema),
  responsesController.submitAuthenticatedResponses
);

// Rotas aninhadas
router.use('/:surveyId/questions', questionRoutes);

/**
 * @openapi
 * /api/surveys/{surveyId}/results:
 *   get:
 *     summary: Obter resultados agregados da pesquisa
 *     tags: [Resultados]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: locationIds
 *         schema:
 *           type: string
 *           description: IDs separados por vírgula
 *     responses:
 *       200:
 *         description: Resultados agregados
 *       403:
 *         description: Sem permissão
 */
router.get('/:surveyId/results', resultsController.getSurveyResults);

/**
 * @openapi
 * /api/surveys/{surveyId}/open-ended-responses:
 *   get:
 *     summary: Obter respostas abertas (texto longo/curto)
 *     tags: [Resultados]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: locationIds
 *         schema:
 *           type: string
 *           description: IDs separados por vírgula
 *     responses:
 *       200:
 *         description: Lista de respostas abertas
 *       403:
 *         description: Sem permissão
 */
router.get('/:surveyId/open-ended-responses', resultsController.getOpenEndedResponses);

/**
 * @openapi
 * /api/surveys/{surveyId}/exports:
 *   post:
 *     summary: Solicitar exportação de relatório (em background)
 *     tags: [Exportações]
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
 *             $ref: '#/components/schemas/ExportRequest'
 *     responses:
 *       202:
 *         description: Exportação solicitada
 *       403:
 *         description: Sem permissão
 */
router.post(
  '/:surveyId/exports',
  validateBody(exportRequestSchema),
  reportsController.requestExport
);

/**
 * @openapi
 * /api/exports/{exportId}/status:
 *   get:
 *     summary: Verificar status de uma exportação
 *     tags: [Exportações]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status da exportação
 */
router.get('/exports/:exportId/status', reportsController.getExportStatus);

/**
 * @openapi
 * /api/exports/{exportId}/download:
 *   get:
 *     summary: Baixar arquivo exportado
 *     tags: [Exportações]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Arquivo CSV/JSON
 *       404:
 *         description: Exportação não encontrada ou não concluída
 */
router.get('/exports/:exportId/download', reportsController.downloadExport);

export default router;
