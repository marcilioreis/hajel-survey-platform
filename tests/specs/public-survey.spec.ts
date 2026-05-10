// tests/specs/public-survey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Public Survey Flow', () => {
  test.beforeEach(async ({ page }) => {
    // seed de uma pesquisa pública com perguntas (via API ou script)
  });

  test('completes full survey flow', async ({ page }) => {
    await page.goto('/s/test-slug');
    await page.click('text=Iniciar Pesquisa');
    // Preencher dados demográficos (exemplo)
    await page.selectOption('#demographics-age', '25-34');
    await page.selectOption('#demographics-gender', 'M');
    // ...
    await page.click('text=Avançar para perguntas');
    
    // Loop de perguntas (supondo uma pergunta de cada tipo)
    // Pergunta 1 - unica_escolha
    await page.click('label:has-text("Opção A")');
    await page.click('text=Próxima');
    // Pergunta 2 - texto_longo
    await page.fill('[data-testid^="answer-text-"]', 'Minha resposta');
    await page.click('text=Concluir respostas');
    
    await expect(page.locator('text=Obrigado')).toBeVisible();
  });
});