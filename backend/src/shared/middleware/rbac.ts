// src/shared/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  user,
  userRoles,
  rolePermissions,
  permissions,
  userPermissions,
} from '../db/schema/index.js';

export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const [userRecord] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));

  if (userRecord?.role === 'admin') {
    return true;
  }

  const [direct] = await db
    .select({ granted: userPermissions.granted })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(and(eq(userPermissions.userId, userId), eq(permissions.code, permissionCode)));

  if (direct) {
    return direct.granted === true;
  }

  const rolePerms = await db
    .select({ code: permissions.code })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(userRoles.userId, userId), eq(permissions.code, permissionCode)))
    .limit(1);

  return rolePerms.length > 0;
}

export async function hasPermissions(
  userId: string,
  permissionCodes: string[],
  mode: 'any' | 'all' = 'any'
): Promise<boolean> {
  if (permissionCodes.length === 0) return true;

  if (mode === 'any') {
    for (const code of permissionCodes) {
      if (await hasPermission(userId, code)) return true;
    }
    return false;
  } else {
    for (const code of permissionCodes) {
      if (!(await hasPermission(userId, code))) return false;
    }
    return true;
  }
}

export function authorize(required: string | string[] | { any?: string[]; all?: string[] }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let requiredCodes: string[] = [];
    let mode: 'any' | 'all' = 'all';

    if (typeof required === 'string') {
      requiredCodes = [required];
      mode = 'all';
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

    // Agora user.id é reconhecido devido à extensão em better-auth.d.ts
    const allowed = await hasPermissions(user.id, requiredCodes, mode);
    if (!allowed) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    next();
  };
}
