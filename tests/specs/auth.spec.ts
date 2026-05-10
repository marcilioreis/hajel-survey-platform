// tests/specs/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'emaildomarcilio@gmail.com');
    await page.fill('[data-testid="login-password"]', 'M@rs6272');
    await page.click('[data-testid="login-submit"]');
    
    await expect(page).toHaveURL('/surveys');
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/surveys');
    await expect(page).toHaveURL('/login');
  });
});