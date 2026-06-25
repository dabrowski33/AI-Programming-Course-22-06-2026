import { test, expect } from '@playwright/test';
import { TEST_JPEG_PATH } from './helpers';

test.describe('Validation paths', () => {
  test('submitting empty form shows validation errors and stays on form', async ({ page }) => {
    await page.goto('/');

    // Click submit without filling anything
    await page.getByRole('button', { name: /Wyślij zgłoszenie/ }).click();

    // Should still be on the intake form (URL unchanged)
    await expect(page).toHaveURL('/');

    // mat-error elements should be visible (Angular Material inline errors)
    const errors = page.locator('mat-error');
    await expect(errors.first()).toBeVisible();
  });

  test('Reklamacja requires reason field — submission blocked without it', async ({ page }) => {
    await page.goto('/');

    // Select Reklamacja type
    await page.getByRole('combobox', { name: /Typ zgłoszenia/ }).click();
    await page.getByRole('option', { name: 'Reklamacja' }).click();

    // Fill all other fields except reason
    await page.getByRole('combobox', { name: /Kategoria sprzętu/ }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('textbox', { name: /Model/ }).fill('Test Laptop');
    await page.getByRole('textbox', { name: /Data zakupu/ }).fill('01/01/2026');
    await page.keyboard.press('Escape');

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /Wybierz zdjęcie/ }).click(),
    ]);
    await fileChooser.setFiles(TEST_JPEG_PATH);

    // Submit without reason
    await page.getByRole('button', { name: /Wyślij zgłoszenie/ }).click();

    // Should stay on the form
    await expect(page).toHaveURL('/');

    // Reason-specific error visible
    await expect(page.locator('mat-error')).toContainText(/wymagany|usterki/i);
  });

  test('Zwrot does not require reason field', async ({ page }) => {
    await page.goto('/');

    // ZWROT is the default type — no reason needed
    await page.getByRole('combobox', { name: /Kategoria sprzętu/ }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('textbox', { name: /Model/ }).fill('Test Laptop');
    await page.getByRole('textbox', { name: /Data zakupu/ }).fill('01/01/2026');
    await page.keyboard.press('Escape');

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /Wybierz zdjęcie/ }).click(),
    ]);
    await fileChooser.setFiles(TEST_JPEG_PATH);

    // Submit without reason — should succeed for ZWROT
    await page.getByRole('button', { name: /Wyślij zgłoszenie/ }).click();
    await expect(page).toHaveURL(/\/chat\/.+/, { timeout: 15_000 });
  });

  test('image is required — error shown when not uploaded', async ({ page }) => {
    await page.goto('/');

    // Fill all fields except image
    await page.getByRole('combobox', { name: /Kategoria sprzętu/ }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('textbox', { name: /Model/ }).fill('Test Laptop');
    await page.getByRole('textbox', { name: /Data zakupu/ }).fill('01/01/2026');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /Wyślij zgłoszenie/ }).click();

    // Should stay on form
    await expect(page).toHaveURL('/');
    // Upload-error class shows the message
    await expect(page.locator('.upload-error')).toContainText(/wymagane/i);
  });
});
