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
import locationRoutes from './locations.routes.js';
import * as controller from './surveys.controller.js';
import * as responsesController from '../responses/responses.controller.js';
import * as resultsController from './results.controller.js';
import * as reportsController from './reports.controller.js';

const router = Router();

// Criar pesquisa: requer permissão survey:create
router.post(
  '/',
  authorize('survey:create'),
  validateBody(createSurveySchema),
  controller.createSurvey
);

// Listar pesquisas do usuário: requer survey:view ou survey:view_any
router.get('/', controller.listSurveysEnriched); // a lógica de permissão está dentro do controller

// Visualizar uma pesquisa específica: pode ser própria (survey:view) ou qualquer (survey:view_any)
router.get('/:id', controller.getSurvey); // a lógica de permissão está dentro do controller

// Atualizar: se for dono (survey:edit) ou admin (survey:edit_any)
router.put(
  '/:id',
  authorize({ any: ['survey:edit', 'survey:edit_any'] }),
  validateBody(updateSurveySchema),
  controller.updateSurvey
);
// Excluir: similar
router.delete(
  '/:id',
  authorize({ any: ['survey:delete', 'survey:delete_any'] }),
  controller.deleteSurvey
);

// Submissão de respostas (usuário autenticado)
router.post(
  '/:surveyId/responses',
  validateBody(authenticatedResponsesSchema),
  responsesController.submitAuthenticatedResponses
);

// Rotas aninhadas
router.use('/:surveyId/questions', questionRoutes);
router.use('/:surveyId/locations', locationRoutes);

// Resultados agregados
router.get('/:surveyId/results', resultsController.getSurveyResults);
router.get('/:surveyId/open-ended-responses', resultsController.getOpenEndedResponses);

// Exportações
router.post(
  '/:surveyId/exports',
  validateBody(exportRequestSchema),
  reportsController.requestExport
);
router.get('/exports/:exportId/status', reportsController.getExportStatus);
router.get('/exports/:exportId/download', reportsController.downloadExport);

export default router;
