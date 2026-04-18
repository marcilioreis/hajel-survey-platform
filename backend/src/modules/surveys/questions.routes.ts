// src/modules/surveys/questions.routes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { authorize } from '../../shared/middleware/rbac.js';
import * as controller from './questions.controller.js';

const router = Router({ mergeParams: true }); // para acessar :surveyId da rota pai

// Todas as rotas exigem autenticação
router.use(authenticate);

router.post('/', authorize('survey:edit'), controller.addQuestion);
router.get('/', authorize('survey:view'), controller.listQuestions);
router.put('/:questionId', authorize('survey:edit'), controller.updateQuestion);
router.delete('/:questionId', authorize('survey:edit'), controller.deleteQuestion);

export default router;
