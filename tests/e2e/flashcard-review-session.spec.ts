import { test, expect } from '@playwright/test';

/**
 * Flashcard review: see card → flip / type answer → rate (Again/Hard/Good/Easy)
 * → next card appears → respect daily limit.
 */

test.describe('flashcard review session', () => {
  test.use({ storageState: 'tests/e2e/.auth/onboarded-user.json' });

  test('should show a due card, rate it Good, and advance to the next', async ({ page }) => {
    await page.goto('/review');

    await expect(page.getByTestId('card-front')).toBeVisible();
    await page.getByRole('button', { name: /mostrar resposta|show answer/i }).click();
    await page.getByRole('button', { name: /^good$|^bom$/i }).click();

    await expect(page.getByTestId('card-front')).toBeVisible(); // next card
  });

  test('should support typing-mode answers and mark correct input green', async ({ page }) => {
    await page.goto('/review?mode=typing');

    const expected = await page.getByTestId('expected-answer').getAttribute('data-answer');
    await page.getByTestId('typing-input').fill(expected ?? '');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('typing-feedback')).toHaveAttribute('data-correct', 'true');
  });

  test('should stop presenting new cards after hitting daily limit', async ({ page, request }) => {
    // Reset review state so "cards reviewed today" starts at 0 regardless
    // of prior tests that consumed the 5 seeded cards.
    await request.post('/api/dev/reset-review-state');
    await page.goto('/settings');
    await page.getByLabel(/meta diária|daily/i).fill('2');
    await page.getByRole('button', { name: /salvar|save/i }).click();

    await page.goto('/review');
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: /mostrar resposta|show answer/i }).click();
      await page.getByRole('button', { name: /^good$|^bom$/i }).click();
    }

    await expect(page.getByText(/meta diária alcançada|daily goal reached/i)).toBeVisible();
  });

  test('should play TTS audio when audio button is pressed', async ({ page }) => {
    await page.goto('/review');

    const audioLoaded = page.waitForEvent('requestfinished', (r) =>
      /\/api\/tts|\.mp3/.test(r.url()),
    );
    await page.getByRole('button', { name: /ouvir|play audio/i }).click();

    await audioLoaded;
  });
});
