import { Router } from 'express';
import * as controller from '../surveys/locations.controller.js';

const router = Router();
router.get('/', controller.listAllLocations);
export default router;
