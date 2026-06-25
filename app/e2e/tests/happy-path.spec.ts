import { test, expect } from '@playwright/test';
import { fillAndSubmitForm, TEST_JPEG_PATH } from './helpers';

// The exact disclaimer text injected by MessageComposer (TAC-003-08 / AC-24)
const DISCLAIMER_FRAGMENT = 'wstępna, automatyczna ocena';

test.describe('Happy path — Reklamacja (complaint)', () => {
  test('complete form → decision → chat flow', async ({ page }) => {
    await fillAndSubmitForm(page, {
      type: 'REKLAMACJA',
      modelPrefix: 'Test Laptop',
      reason: 'Ekran nie działa',
    });

    // Should navigate to /chat/:sessionId
    await expect(page).toHaveURL(/\/chat\/.+/, { timeout: 15_000 });

    // Case summary header visible
    await expect(page.locator('.case-summary')).toBeVisible();
    await expect(page.locator('.case-summary')).toContainText('Reklamacja');
    await expect(page.locator('.case-summary')).toContainText('Test Laptop');

    // First assistant message rendered
    await expect(page.locator('.messages-container')).toBeVisible({ timeout: 10_000 });

    // Decision label in chat
    await expect(page.locator('body')).toContainText('Kwalifikuje się', { timeout: 10_000 });

    // Mandatory disclaimer always present (TAC-003-08 / AC-24)
    await expect(page.locator('body')).toContainText(DISCLAIMER_FRAGMENT, { timeout: 10_000 });

    // Send a follow-up message
    const composer = page.getByRole('textbox', { name: /Twoja wiadomość/ });
    await composer.fill('Ile czasu mam na złożenie reklamacji?');
    await page.getByRole('button', { name: /Wyślij wiadomość/ }).click();

    // Streaming response arrives (stub returns "Dziękujemy za pytanie.")
    await expect(page.locator('body')).toContainText('Dziękujemy', { timeout: 15_000 });

    // Send button re-enables when text is entered (disabled only while streaming or empty)
    await composer.fill('Kolejne pytanie');
    await expect(page.getByRole('button', { name: /Wyślij wiadomość/ })).not.toBeDisabled({ timeout: 10_000 });
  });
});

test.describe('Happy path — Zwrot (return)', () => {
  test('complete Zwrot form → decision → chat flow', async ({ page }) => {
    await fillAndSubmitForm(page, {
      type: 'ZWROT',
      modelPrefix: 'Test Laptop',
    });

    await expect(page).toHaveURL(/\/chat\/.+/, { timeout: 15_000 });
    await expect(page.locator('.case-summary')).toContainText('Zwrot');
    await expect(page.locator('body')).toContainText('Kwalifikuje się', { timeout: 10_000 });
    await expect(page.locator('body')).toContainText(DISCLAIMER_FRAGMENT, { timeout: 10_000 });
  });
});
