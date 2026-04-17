// src/shared/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

export const authorize = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Exemplo simples: usuários com role 'admin' têm todas as permissões
    if (user.role === 'admin') {
      return next();
    }

    // Aqui você implementará a verificação real de permissões no banco de dados.
    // Por enquanto, retornamos 403 para qualquer outra role.
    return res.status(403).json({ error: 'Forbidden' });
  };
};
