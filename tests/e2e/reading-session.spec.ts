import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const EPUB = join(__dirname, '../fixtures/epubs/three-chapters.epub');

test.describe('reading session', () => {
  test.use({ storageState: 'tests/e2e/.auth/onboarded-user.json' });

  test.skip(!existsSync(EPUB), 'EPUB fixture not present');

  test('should import EPUB and list it in the library', async ({ page }) => {
    await page.goto('/library');

    await page.getByTestId('epub-upload').setInputFiles(EPUB);

    await expect(page.getByText(/Three Chapters Sample/)).toBeVisible();
    await expect(page.getByTestId('chapter-item')).toHaveCount(3);
  });

  test('should open a chapter and show the reader with tokenized words', async ({ page }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();

    await expect(page).toHaveURL(/\/read\/.+/);
    await expect(page.locator('[data-token="word"]').first()).toBeVisible();
  });

  test('should open tooltip with translation when clicking a word', async ({ page }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();

    await page.locator('[data-token="word"]').first().click();

    await expect(page.getByTestId('word-tooltip')).toBeVisible();
    await expect(page.getByTestId('word-tooltip-translation')).not.toBeEmpty();
    await expect(
      page.getByTestId('word-tooltip').getByRole('button', { name: /adicionar|add flashcard/i }),
    ).toBeVisible();
  });

  test('should add a flashcard from the reading tooltip and find it in review', async ({
    page,
  }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();

    const firstWord = page.locator('[data-token="word"]').first();
    const wordText = (await firstWord.textContent())?.trim();
    await firstWord.click();
    await page
      .getByTestId('word-tooltip')
      .getByRole('button', { name: /adicionar|add flashcard/i })
      .click();

    await page.goto('/review');
    await expect(page.getByText(new RegExp(wordText ?? '', 'i'))).toBeVisible();
  });

  test('should change word background color as familiarity progresses', async ({ page }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();

    const word = page.locator('[data-token="word"]').first();
    const initialColor = await word.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );

    await word.click();
    await page.getByTestId('familiarity-advance').click();

    const nextColor = await word.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(nextColor).not.toBe(initialColor);
  });

  test('should open sentence modal with translation and grammar on sentence click', async ({
    page,
  }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();

    await page.locator('[data-token="sentence"]').first().click();

    await expect(page.getByTestId('sentence-modal')).toBeVisible();
    await expect(page.getByTestId('sentence-translation')).not.toBeEmpty();
    await expect(page.getByTestId('sentence-grammar')).not.toBeEmpty();
  });

  test('should show karaoke-style TTS highlight when playing audio', async ({ page }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();

    await page.getByRole('button', { name: /play|ouvir/i }).click();

    await expect(page.locator('[data-karaoke-active="true"]').first()).toBeVisible();
  });

  test('should offer "review learned words" button at end of session', async ({ page }) => {
    await page.goto('/library');
    await page.getByText(/Three Chapters Sample/).click();
    await page.getByTestId('chapter-item').first().click();
    await page.getByRole('button', { name: /finalizar sessão|end session/i }).click();

    await expect(
      page.getByRole('button', { name: /revisar palavras|review learned words/i }),
    ).toBeVisible();
  });
});
