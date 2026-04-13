import { test, expect } from '@playwright/test';

test.describe('settings — BYOK management', () => {
  test.use({ storageState: 'tests/e2e/.auth/onboarded-user.json' });

  test('should save a Claude API key and show it masked', async ({ page }) => {
    await page.goto('/settings/api-keys');

    await page.getByLabel(/claude/i).fill('sk-ant-very-secret-ABCDEF');
    await page.getByRole('button', { name: /salvar|save/i }).click();

    await expect(page.getByTestId('key-claude-masked')).toContainText(/\*{4,}/);
    await expect(page.getByTestId('key-claude-masked')).not.toContainText('ABCDEF');
  });

  test('should update an existing key', async ({ page }) => {
    await page.goto('/settings/api-keys');
    await page.getByLabel(/claude/i).fill('sk-ant-v1');
    await page.getByRole('button', { name: /salvar|save/i }).click();

    await page.getByRole('button', { name: /editar|edit/i }).first().click();
    await page.getByLabel(/claude/i).fill('sk-ant-v2');
    await page.getByRole('button', { name: /salvar|save/i }).click();

    await expect(page.getByText(/atualizada|updated/i)).toBeVisible();
  });

  test('should delete an API key with confirmation', async ({ page }) => {
    await page.goto('/settings/api-keys');
    await page.getByLabel(/claude/i).fill('sk-del');
    await page.getByRole('button', { name: /salvar|save/i }).click();

    await page.getByRole('button', { name: /remover|delete/i }).first().click();
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    await expect(page.getByTestId('key-claude-masked')).toHaveCount(0);
  });

  test('should reorder providers via drag and persist the order', async ({ page, request }) => {
    // Reset to a known [claude, openai] state so this test is independent
    // of prior save/update/delete tests that mutate the shared user.
    await request.post('/api/dev/reset-api-keys');
    await page.goto('/settings/api-keys');

    const first = page.getByTestId('provider-row').first();
    const second = page.getByTestId('provider-row').nth(1);
    const firstName = await first.getAttribute('data-provider');
    const secondName = await second.getAttribute('data-provider');

    await first.dragTo(second);
    await page.reload();

    expect(
      await page.getByTestId('provider-row').first().getAttribute('data-provider'),
    ).toBe(secondName);
    expect(
      await page.getByTestId('provider-row').nth(1).getAttribute('data-provider'),
    ).toBe(firstName);
  });

  test('should trigger export and download a JSON file', async ({ page }) => {
    await page.goto('/settings/data');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /exportar meus dados|export my data/i }).click();
    const file = await download;

    expect(file.suggestedFilename()).toMatch(/\.json$/);
  });
});
