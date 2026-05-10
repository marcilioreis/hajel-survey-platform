import { test, expect } from '@playwright/test';

test('respondent can complete a public survey', async ({ page }) => {
  await page.goto('/s/abc123'); // link público
  await page.fill('[name="age"]', '30');
  await page.click('text=Próxima');
  await page.click('text=Opção A');
  await page.click('text=Enviar');
  await expect(page.locator('text=Obrigado pela participação')).toBeVisible();
});