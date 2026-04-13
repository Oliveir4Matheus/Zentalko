import { test, expect } from '@playwright/test';

/**
 * End-to-end proof that the router falls back across providers when a user
 * hits the three known failure modes. Providers are stubbed at the network
 * layer via Playwright's route interception.
 */

// SKIPPED — arquitetural. `reading.translateWord` roda server-side via tRPC,
// então `page.route('**/api.anthropic.com/**', …)` do Playwright (que só
// intercepta fetches do browser) nunca dispara. A cobertura de fallback do
// LLM router está garantida em tests/unit/llm-router.test.ts (8/8), que
// exercita os 3 modos de falha (network, 401/403, 429) + "all providers
// failed". Manter o roteamento no servidor é decisão consciente: protege o
// BYOK e centraliza logging/rate-limit. Reativar esta suíte exigiria expor
// um endpoint client-facing (ex.: `/api/llm/translate`) que aumenta a
// superfície de API — trade-off rejeitado.
test.describe.skip('LLM provider fallback (end-to-end)', () => {
  test.use({ storageState: 'tests/e2e/.auth/onboarded-user.json' });

  test('should fall back from Claude to OpenAI on network error', async ({ page }) => {
    const calls: string[] = [];
    await page.route('**/api.anthropic.com/**', async (route) => {
      calls.push('claude');
      await route.abort('failed');
    });
    await page.route('**/api.openai.com/**', async (route) => {
      calls.push('openai');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: '{"translation":"oi"}' } }],
        }),
      });
    });

    await page.goto('/read/demo');
    await page.locator('[data-token="word"]').first().click();

    await expect(page.getByTestId('word-tooltip-translation')).not.toBeEmpty();
    expect(calls).toEqual(['claude', 'openai']);
  });

  test('should fall back on 429 rate-limit', async ({ page }) => {
    const calls: string[] = [];
    await page.route('**/api.anthropic.com/**', async (route) => {
      calls.push('claude');
      await route.fulfill({ status: 429, body: JSON.stringify({ error: 'rate_limit' }) });
    });
    await page.route('**/api.openai.com/**', async (route) => {
      calls.push('openai');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: '{"translation":"oi"}' } }],
        }),
      });
    });

    await page.goto('/read/demo');
    await page.locator('[data-token="word"]').first().click();

    await expect(page.getByTestId('word-tooltip-translation')).not.toBeEmpty();
    expect(calls).toEqual(['claude', 'openai']);
  });

  test('should fall back on 401 invalid key and surface a warning later', async ({ page }) => {
    const calls: string[] = [];
    await page.route('**/api.anthropic.com/**', async (route) => {
      calls.push('claude');
      await route.fulfill({ status: 401, body: JSON.stringify({ error: 'auth' }) });
    });
    await page.route('**/api.openai.com/**', async (route) => {
      calls.push('openai');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: '{"translation":"oi"}' } }],
        }),
      });
    });

    await page.goto('/read/demo');
    await page.locator('[data-token="word"]').first().click();

    await expect(page.getByTestId('word-tooltip-translation')).not.toBeEmpty();
    expect(calls).toContain('claude');
    // user should eventually see a "your Claude key is invalid" notice
    await expect(page.getByTestId('invalid-key-warning-claude')).toBeVisible();
  });

  test('should surface a friendly error when every provider fails', async ({ page }) => {
    await page.route('**/api.anthropic.com/**', (r) => r.abort('failed'));
    await page.route('**/api.openai.com/**', (r) => r.abort('failed'));
    await page.route('**/openrouter.ai/**', (r) => r.abort('failed'));
    await page.route('**/generativelanguage.googleapis.com/**', (r) => r.abort('failed'));

    await page.goto('/read/demo');
    await page.locator('[data-token="word"]').first().click();

    await expect(page.getByTestId('llm-all-failed')).toBeVisible();
  });
});
