// import { Router } from 'express';
// import { authenticate } from '../../shared/auth/middleware.js';
// import { db } from '../../shared/db/index.js';
// import { roles, permissions, userRoles, rolePermissions } from '../../shared/db/schema/index.js';
// import { eq } from 'drizzle-orm';

// const router = Router();

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

// export default router;
