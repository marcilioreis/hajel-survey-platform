# Esqueleto Backend — 4 camadas

Exemplo: adicionar `PATCH /api/surveys/:id/archive` (arquivar pesquisa).
Adapte nomes ao seu caso. Imports relativos terminam em `.js`.

## 1. Zod — `shared/validation/schemas.ts`
```ts
import { z } from 'zod';

export const archiveSurveyParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type ArchiveSurveyParams = z.infer<typeof archiveSurveyParamsSchema>;
```

## 2. Service — `modules/surveys/surveys.service.ts` (única camada com `db`)
```ts
import { db } from '../../shared/db/index.js';
import { surveys } from '../../shared/db/schema/index.js';
import { eq } from 'drizzle-orm';

export async function archiveSurvey(id: number): Promise<void> {
  const [existing] = await db.select().from(surveys).where(eq(surveys.id, id));
  if (!existing) {
    throw new Error('Pesquisa não encontrada');
  }
  await db.update(surveys).set({ active: false }).where(eq(surveys.id, id));
}
```

## 3. Controller — `modules/surveys/surveys.controller.ts` (sem `db`)
```ts
import { Request, Response, NextFunction } from 'express';
import * as service from './surveys.service.js';

export async function archiveSurvey(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await service.archiveSurvey(id);
    return res.status(200).json({ message: 'Pesquisa arquivada' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Pesquisa não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}
```

## 4. Route — `modules/surveys/surveys.routes.ts`
```ts
import { authorize } from '../../shared/middleware/rbac.js';
import { validateParams } from '../../shared/middleware/validate.js';
import { archiveSurveyParamsSchema } from '../../shared/validation/schemas.js';
import * as controller from './surveys.controller.js';

/**
 * @openapi
 * /api/surveys/{id}/archive:
 *   patch:
 *     summary: Arquivar uma pesquisa
 *     tags: [Surveys]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pesquisa arquivada }
 *       403: { description: Sem permissão }
 *       404: { description: Pesquisa não encontrada }
 */
router.patch(
  '/:id/archive',
  authorize('survey:edit_any'),
  validateParams(archiveSurveyParamsSchema),
  controller.archiveSurvey
);
```

Notas:
- O middleware global `authenticate` + `loadPermissions` já roda antes destas rotas
  (montadas no `app.ts`). `authorize` só checa o Set de permissões.
- Erros de domínio: lance `Error` com mensagem PT no service; traduza para status HTTP
  no controller. Para erros inesperados, chame `next(error)` (handler central).
