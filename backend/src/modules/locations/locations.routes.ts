import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { locationCatalogSchema, locationUpdateSchema } from '../../shared/validation/schemas.js';
import * as controller from './locations.controller.js';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

router.get('/', controller.listAll); // GET /api/locations
router.post(
  '/',
  authorize('survey:edit_any'), // permissão administrativa
  validateBody(locationCatalogSchema),
  controller.create
);
router.put(
  '/:id',
  authorize('survey:edit_any'),
  validateBody(locationUpdateSchema),
  controller.update
);
router.delete('/:id', authorize('survey:edit_any'), controller.remove);

export default router;
