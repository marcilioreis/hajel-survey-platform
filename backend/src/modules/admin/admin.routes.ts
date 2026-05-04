// import { db } from '../../shared/db/index.js';
// import { roles, permissions, userRoles, rolePermissions } from '../../shared/db/schema/index.js';
// import { eq } from 'drizzle-orm';

import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { loadPermissions } from '../../shared/middleware/loadPermissions.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  updateUserAdminSchema,
  createRoleSchema,
  updateRoleSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './admin.controller.js';

const router = Router();

// router.post('/setup/seed', authenticate, async (req, res) => {
//   // Verifica se o usuário é admin (apenas para execução inicial)
//   const userId = req.user!.id;
//   const [user] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
//   if (user?.role !== 'admin')
//     return res.status(403).json({ error: 'Apenas admin pode executar o seed' });

//   // Aqui você pode replicar a lógica do seed.ts
//   // ... (inserir roles, permissions, etc.)

//   res.json({ success: true, message: 'Seed executado com sucesso' });
// });

// Aplica autenticação e carregamento de permissões a todas as rotas
router.use(authenticate, loadPermissions);

// -- Usuários --
router.get('/users', authorize('user:manage'), controller.listUsers);
router.get('/users/:id', authorize('user:manage'), controller.getUser);
router.put(
  '/users/:id',
  authorize('user:manage'),
  validateBody(updateUserAdminSchema),
  controller.updateUser
);

// -- Roles --
router.get('/roles', authorize('role:manage'), controller.listRoles);
router.post(
  '/roles',
  authorize('role:manage'),
  validateBody(createRoleSchema),
  controller.createRole
);
router.put(
  '/roles/:id',
  authorize('role:manage'),
  validateBody(updateRoleSchema),
  controller.updateRole
);

// -- Permissões --
router.get('/permissions', authorize('role:manage'), controller.listPermissions); // pode ser user:manage também, escolha

// -- Auditoria --
router.get('/audit-logs', authorize('audit:view'), controller.listAuditLogs);

export default router;
