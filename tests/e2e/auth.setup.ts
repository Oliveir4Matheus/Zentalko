import { test as setup, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const AUTH_FILE = 'tests/e2e/.auth/onboarded-user.json';

setup('authenticate onboarded user', async ({ page, request }) => {
  mkdirSync(dirname(AUTH_FILE), { recursive: true });

  const email = `e2e+${Date.now()}@example.com`;
  const password = 'senha-forte-1';

  await page.goto('/signup');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/senha|password/i).fill(password);
  await page.getByRole('button', { name: /criar conta|sign up/i }).click();
  await page.waitForURL(/\/onboarding/);

  // Step 1: languages
  await page.getByLabel(/idioma nativo|native/i).selectOption('pt_BR');
  await page.getByLabel(/idioma alvo|target/i).selectOption('en');
  await page.getByRole('button', { name: /próximo|next/i }).click();

  // Step 2: API key (Claude)
  await page.getByLabel(/claude/i).first().fill('sk-ant-e2e-setup');
  await page.getByRole('button', { name: /próximo|next/i }).click();

  // Step 3: daily goal
  await page.getByLabel(/meta diária|daily/i).fill('20');
  await page.getByRole('button', { name: /próximo|next/i }).click();

  // Step 4: placement (pick first option on every question)
  const questions = page.getByTestId('placement-question');
  const count = await questions.count();
  for (let i = 0; i < count; i++) {
    await questions.nth(i).locator('input[type=radio]').first().check();
  }
  await page.getByRole('button', { name: /finalizar|finish/i }).click();
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByTestId('cefr-level-badge')).toBeVisible();

  // Seed a small deck so review specs have due cards to work with.
  await page.request.post('/api/dev/seed-cards');

  await page.context().storageState({ path: AUTH_FILE });
});
