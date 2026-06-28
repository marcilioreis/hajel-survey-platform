import { test, expect } from '@playwright/test';

// Usa a sessão autenticada (storageState) configurada no projeto.
test.describe('Calculadora de margem de erro', () => {
  test('calcula a margem a partir do tamanho da amostra', async ({ page }) => {
    await page.goto('/surveys/new');

    await expect(
      page.getByText('Calculadora de margem de erro')
    ).toBeVisible();

    // Aba "Tenho a amostra" é o padrão; informa n = 384.
    await page.locator('#moe-sample').fill('384');

    // Para n=384, 95% de confiança e p=50%, a margem é ~5,0%.
    const resultado = page.locator('[aria-live="polite"]');
    await expect(resultado).toContainText('Margem de erro:');
    await expect(resultado).toContainText('5,0%');
  });

  test('calcula a amostra mínima a partir da margem desejada', async ({ page }) => {
    await page.goto('/surveys/new');

    await page.getByRole('tab', { name: 'Quero a margem' }).click();
    await page.locator('#moe-margin').fill('5');

    const resultado = page.locator('[aria-live="polite"]');
    // e=5%, 95%, p=50% → n mínimo = 385.
    await expect(resultado).toContainText('385');
  });
});
