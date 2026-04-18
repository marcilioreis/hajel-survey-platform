// src/modules/surveys/surveys.routes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { authorize } from '../../shared/middleware/rbac.js';
import * as controller from './surveys.controller.js';
import questionRoutes from './questions.routes.js';
import locationRoutes from './locations.routes.js';
import * as resultsController from './results.controller.js';
import * as reportsController from './reports.controller.js';

const router = Router();

// Criar pesquisa: requer permissão survey:create
router.post('/', authenticate, authorize('survey:create'), controller.createSurvey);

// Listar pesquisas do usuário: requer survey:view ou survey:view_any
router.get('/', authenticate, controller.listSurveys); // a lógica de permissão está dentro do controller

// Visualizar uma pesquisa específica: pode ser própria (survey:view) ou qualquer (survey:view_any)
router.get('/:id', authenticate, controller.getSurvey); // a lógica de permissão está dentro do controller

// Atualizar: se for dono (survey:edit) ou admin (survey:edit_any)
router.put(
  '/:id',
  authenticate,
  authorize({ any: ['survey:edit', 'survey:edit_any'] }),
  controller.updateSurvey
);
// Excluir: similar
router.delete(
  '/:id',
  authenticate,
  authorize({ any: ['survey:delete', 'survey:delete_any'] }),
  controller.deleteSurvey
);

// Rotas aninhadas
router.use('/:surveyId/questions', questionRoutes);
router.use('/:surveyId/locations', locationRoutes);

// Resultados agregados
router.get('/:surveyId/results', authenticate, resultsController.getSurveyResults);

// Exportações
router.post('/:surveyId/exports', authenticate, reportsController.requestExport);
router.get('/exports/:exportId/status', authenticate, reportsController.getExportStatus);
router.get('/exports/:exportId/download', authenticate, reportsController.downloadExport);

export default router;
