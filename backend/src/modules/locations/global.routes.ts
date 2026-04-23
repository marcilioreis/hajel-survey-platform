import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import * as controller from '../surveys/locations.controller.js';

const router = Router();
router.get('/', authenticate, controller.listAllLocations);
export default router;
