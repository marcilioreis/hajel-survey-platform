// src/modules/surveys/locations.routes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { authorize } from '../../shared/middleware/rbac.js';
import * as controller from './locations.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', authorize('survey:edit'), controller.addLocation);
router.get('/', authorize('survey:view'), controller.listLocations);
router.put('/:locationId', authorize('survey:edit'), controller.updateLocation);
router.delete('/:locationId', authorize('survey:edit'), controller.deleteLocation);

export default router;
