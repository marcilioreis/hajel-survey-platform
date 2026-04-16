import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { authorize } from '../../shared/middleware/rbac';
import * as controller from './surveys.controller';

const router = Router();

router.post('/', authenticate, authorize('survey:create'), controller.createSurvey);
router.get('/', authenticate, controller.listSurveys);
// router.get('/:id', authenticate, controller.getSurvey);
// router.put('/:id', authenticate, authorize('survey:edit'), controller.updateSurvey);
// router.delete('/:id', authenticate, authorize('survey:delete'), controller.deleteSurvey);

export default router;