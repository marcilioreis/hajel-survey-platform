import { Router } from 'express';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { createLocationSchema, updateLocationSchema } from '../../shared/validation/schemas.js';
import * as controller from './locations.controller.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authorize('survey:edit'),
  validateBody(createLocationSchema),
  controller.addLocation
);
router.get('/', authorize('survey:view'), controller.listLocations);
router.put(
  '/:locationId',
  authorize('survey:edit'),
  validateBody(updateLocationSchema),
  controller.updateLocation
);
router.delete('/:locationId', authorize('survey:edit'), controller.deleteLocation);

export default router;
