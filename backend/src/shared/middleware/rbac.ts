// src/shared/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Verifica se o usuário possui uma determinada permissão.
 * Utiliza o cache carregado em req.userPermissions (loadPermissions middleware).
 */
export const hasPermission = (req: Request, permissionCode: string): boolean => {
  if (req.isAdmin) return true; // admin tem acesso total
  return req.userPermissions?.has(permissionCode) ?? false;
};

/**
 * Verifica múltiplas permissões.
 */
export const hasPermissions = (
  req: Request,
  permissionCodes: string[],
  mode: 'any' | 'all' = 'any'
): boolean => {
  if (req.isAdmin) return true;
  if (!req.userPermissions) return false;
  if (permissionCodes.length === 0) return true;
  if (mode === 'any') {
    return permissionCodes.some((code) => req.userPermissions!.has(code));
  } else {
    return permissionCodes.every((code) => req.userPermissions!.has(code));
  }
};

/**
 * Middleware de autorização (atualizado).
 */
export const authorize = (required: string | string[] | { any?: string[]; all?: string[] }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let requiredCodes: string[] = [];
    let mode: 'any' | 'all' = 'all';

    if (typeof required === 'string') {
      requiredCodes = [required];
    } else if (Array.isArray(required)) {
      requiredCodes = required;
      mode = 'all';
    } else if (typeof required === 'object') {
      if (required.all) {
        requiredCodes = required.all;
        mode = 'all';
      } else if (required.any) {
        requiredCodes = required.any;
        mode = 'any';
      }
    }

    if (req.isAdmin) return next(); // admin passa direto
    const allowed = hasPermissions(req, requiredCodes, mode);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};
