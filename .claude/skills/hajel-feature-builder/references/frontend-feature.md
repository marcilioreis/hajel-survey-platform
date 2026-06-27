# Esqueleto Frontend — feature slice (RTK Query + lazyPage)

Exemplo: feature que consome `PATCH /api/surveys/:id/archive`.

## 1. Tipos — `features/surveys/surveys.types.ts`
```ts
export interface ArchiveSurveyResponse {
  message: string;
}
```

## 2. API slice — `features/surveys/surveysApi.ts`
Injeta no `api` base (de `lib/api.ts`), que já trata Bearer + refresh.
```ts
import { api } from '../../lib/api';
import type { ArchiveSurveyResponse } from './surveys.types';

export const surveysApi = api.injectEndpoints({
  endpoints: (builder) => ({
    archiveSurvey: builder.mutation<ArchiveSurveyResponse, number>({
      query: (id) => ({
        url: `/surveys/${id}/archive`,
        method: 'PATCH',
      }),
      // invalida a lista e o detalhe para refletir o novo status
      invalidatesTags: (_result, _error, id) => [
        { type: 'Survey', id },
        { type: 'Survey', id: 'LIST' },
      ],
    }),
  }),
});

export const { useArchiveSurveyMutation } = surveysApi;
```
Use as tags já registradas no `api` base: `Survey`, `Response`, `Report`,
`Location`, `AdminUser`, `AdminRole`. Nomes de endpoint não podem colidir entre
`authApi` e `adminApi` (lição aprendida: `updateUser` → renomeado para `updateProfile`).

## 3. Componente — props tipadas, shadcn, sem `any`
```tsx
import { Button } from '@/components/ui/button';
import { useArchiveSurveyMutation } from './surveysApi';
import { toast } from 'sonner';

interface ArchiveButtonProps {
  surveyId: number;
}

export function ArchiveButton({ surveyId }: ArchiveButtonProps) {
  const [archive, { isLoading }] = useArchiveSurveyMutation();

  const handleClick = async () => {
    try {
      await archive(surveyId).unwrap();
      toast.success('Pesquisa arquivada');
    } catch {
      toast.error('Falha ao arquivar a pesquisa');
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Arquivando...' : 'Arquivar'}
    </Button>
  );
}
```

## 4. Página com lazyPage — `routes/index.tsx`
```tsx
import { lazyPage } from '../components/common/LazyPage';

const SurveyDetail = lazyPage(() => import('../features/surveys/SurveyDetail'));
// ...registrar dentro de <ProtectedRoute> ou <AdminRoute> conforme a permissão.
```

## Padrões a respeitar
- Inicialização de estado por `key` (remontagem), não `useEffect`.
- Datas: `react-day-picker`; formatação via util `utils/date.ts`.
- Polling de export: `setInterval` ≤ 2s com limite de tentativas (~3 falhas), depois aborta.
- `React.memo` só em componentes comprovadamente pesados.
