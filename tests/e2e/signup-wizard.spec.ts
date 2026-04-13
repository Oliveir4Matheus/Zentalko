import { test, expect } from '@playwright/test';

/**
 * Onboarding wizard: languages → BYOK (>=1 key) → daily goal → CEFR placement.
 * Acceptance: until completed, the user CANNOT access /dashboard.
 */

test.describe('signup + onboarding wizard', () => {
  const email = `user+${Date.now()}@example.com`;
  const password = 'senha-forte-1';

  test('should sign up with email and land on /onboarding', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/senha|password/i).fill(password);
    await page.getByRole('button', { name: /criar conta|sign up/i }).click();

    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('should block /dashboard access until onboarding is complete', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(`b+${Date.now()}@example.com`);
    await page.getByLabel(/senha|password/i).fill(password);
    await page.getByRole('button', { name: /criar conta|sign up/i }).click();

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/onboarding/); // guard redirects back
  });

  test('should complete the full wizard and unlock the dashboard', async ({ page }) => {
    await page.goto('/signup');
    const mail = `c+${Date.now()}@example.com`;
    await page.getByLabel(/email/i).fill(mail);
    await page.getByLabel(/senha|password/i).fill(password);
    await page.getByRole('button', { name: /criar conta|sign up/i }).click();

    // Step 1 — languages
    await page.getByLabel(/idioma nativo|native/i).selectOption('pt-BR');
    await page.getByLabel(/idioma alvo|target/i).selectOption('en');
    await page.getByRole('button', { name: /próximo|next/i }).click();

    // Step 2 — BYOK (at least one key required)
    await page.getByRole('button', { name: /próximo|next/i }).click();
    await expect(page.getByText(/pelo menos uma chave|at least one api key/i)).toBeVisible();
    await page.getByLabel(/claude/i).fill('sk-ant-test-key');
    await page.getByRole('button', { name: /próximo|next/i }).click();

    // Step 3 — daily goal
    await page.getByLabel(/meta diária|daily/i).fill('20');
    await page.getByRole('button', { name: /próximo|next/i }).click();

    // Step 4 — placement test (mandatory). Answer all to reach a level.
    const questions = page.locator('[data-testid="placement-question"]');
    const count = await questions.count();
    for (let i = 0; i < count; i++) {
      await questions.nth(i).locator('input[type=radio]').first().check();
    }
    await page.getByRole('button', { name: /finalizar|finish/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should never place the user below A1 even with all answers wrong', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(`z+${Date.now()}@example.com`);
    await page.getByLabel(/senha|password/i).fill(password);
    await page.getByRole('button', { name: /criar conta|sign up/i }).click();

    // fast-forward through wizard with minimum valid data
    await page.getByLabel(/idioma nativo|native/i).selectOption('pt-BR');
    await page.getByLabel(/idioma alvo|target/i).selectOption('en');
    await page.getByRole('button', { name: /próximo|next/i }).click();
    await page.getByLabel(/claude/i).fill('sk-ant-test-key');
    await page.getByRole('button', { name: /próximo|next/i }).click();
    await page.getByLabel(/meta diária|daily/i).fill('20');
    await page.getByRole('button', { name: /próximo|next/i }).click();

    // Intentionally pick the LAST (likely-wrong) option on every question.
    const qs = page.locator('[data-testid="placement-question"]');
    const n = await qs.count();
    for (let i = 0; i < n; i++) {
      await qs.nth(i).locator('input[type=radio]').last().check();
    }
    await page.getByRole('button', { name: /finalizar|finish/i }).click();

    await expect(page.getByTestId('cefr-level-badge')).toHaveText(/A1/);
  });
});
