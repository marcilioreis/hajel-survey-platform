// tests/utils/api.ts
import { request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/api';

export async function createAuthenticatedContext() {
  const context = await request.newContext({
    httpCredentials: { username: '', password: '' }, // se necessário
  });
  // Faz login para obter cookie/sessão
  const loginRes = await context.post(`${BASE_URL}/auth/sign-in/email`, {
    data: { email: 'admin@test.com', password: 'password' },
  });
  if (!loginRes.ok()) throw new Error('Falha no login');
  return context;
}

export async function createPublicSurvey(
  api: APIRequestContext,
  slug: string,
  questions: any[],
) {
  const surveyRes = await api.post(`${BASE_URL}/surveys`, {
    data: {
      title: `Pesquisa Teste ${slug}`,
      endDate: new Date(Date.now() + 86400000).toISOString(),
      public: true,
      active: true,
      slug,
    },
  });
  const survey = await surveyRes.json();

  // Adiciona perguntas em lote
  await api.post(`${BASE_URL}/surveys/${survey.id}/questions/batch`, {
    data: questions,
  });

  return survey;
}