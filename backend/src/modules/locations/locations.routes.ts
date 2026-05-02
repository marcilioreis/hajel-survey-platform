import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { locationCatalogSchema, locationUpdateSchema } from '../../shared/validation/schemas.js';
import * as controller from './locations.controller.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/locations:
 *   get:
 *     summary: Listar todos os locais (catálogo global)
 *     tags: [Locations]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de locais
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LocationCatalog'
 */
router.get('/', controller.listAll);

/**
 * @openapi
 * /api/locations:
 *   post:
 *     summary: Criar novo local no catálogo global
 *     tags: [Locations]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationCatalogInput'
 *     responses:
 *       201:
 *         description: Local criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationCatalog'
 *       400:
 *         description: Dados inválidos
 */
router.post(
  '/',
  authorize('survey:edit_any'),
  validateBody(locationCatalogSchema),
  controller.create
);

/**
 * @openapi
 * /api/locations/{id}:
 *   put:
 *     summary: Atualizar local existente
 *     tags: [Locations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationUpdate'
 *     responses:
 *       200:
 *         description: Local atualizado
 *       404:
 *         description: Local não encontrado
 */
router.put(
  '/:id',
  authorize('survey:edit_any'),
  validateBody(locationUpdateSchema),
  controller.update
);

/**
 * @openapi
 * /api/locations/{id}:
 *   delete:
 *     summary: Excluir local
 *     tags: [Locations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Local excluído
 */
router.delete('/:id', authorize('survey:edit_any'), controller.remove);

export default router;
