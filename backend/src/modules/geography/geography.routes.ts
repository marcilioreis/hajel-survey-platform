// src/modules/geography/geography.routes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import * as controller from './geography.controller.js';

const router = Router();
router.use(authenticate);
router.get('/states', controller.getStates);
router.get('/municipalities/:uf', controller.getMunicipalities);
router.get('/neighborhoods/:city', controller.getNeighborhoods);
router.get('/neighborhoods/:ibgeCode', controller.getNeighborhoods);
router.get('/cep/:cep', controller.getCepInfo);

export default router;
