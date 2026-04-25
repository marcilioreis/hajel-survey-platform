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

router.post(
  '/',
  authorize('survey:edit'),
  validateBody(createQuestionSchema),
  controller.addQuestion
);
router.post(
  '/batch',
  authorize('survey:edit'),
  validateBody(batchCreateQuestionsSchema),
  controller.addQuestionsBatch
);
router.get('/', authorize('survey:view'), controller.listQuestions);
router.put(
  '/:questionId',
  authorize('survey:edit'),
  validateBody(updateQuestionSchema),
  controller.updateQuestion
);
router.delete('/:questionId', authorize('survey:edit'), controller.deleteQuestion);

export default router;
