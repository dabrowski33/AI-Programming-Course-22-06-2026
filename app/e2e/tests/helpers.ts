import { Page } from '@playwright/test';
import * as path from 'path';

export const FIXTURE_DIR = path.join(__dirname, '../../fixtures');
export const TEST_JPEG_PATH = path.join(FIXTURE_DIR, 'test-upload.jpg');

/** Fills and submits the intake form, navigating to the chat screen.
 *  @param modelPrefix - prefix for the model name field, used to drive stub decision category
 *    e.g. 'ELIGIBLE:Test', 'NOT_ELIGIBLE:Test', 'NEEDS_HUMAN_REVIEW:Test', 'MORE_INFO_REQUIRED:Test'
 *    Any non-prefixed value defaults to ELIGIBLE.
 *  @param type - 'ZWROT' or 'REKLAMACJA'
 *  @param reason - required when type='REKLAMACJA'
 */
export async function fillAndSubmitForm(
  page: Page,
  {
    modelPrefix = 'Test Laptop',
    type = 'ZWROT',
    reason = '',
  }: {
    modelPrefix?: string;
    type?: 'ZWROT' | 'REKLAMACJA';
    reason?: string;
  } = {}
): Promise<void> {
  await page.goto('/');

  // Select type
  await page.getByRole('combobox', { name: /Typ zgłoszenia/ }).click();
  const typeLabel = type === 'REKLAMACJA' ? 'Reklamacja' : 'Zwrot';
  await page.getByRole('option', { name: typeLabel }).click();

  // Select category
  await page.getByRole('combobox', { name: /Kategoria sprzętu/ }).click();
  await page.getByRole('option').first().click();

  // Fill model (drives stub category routing via prefix)
  await page.getByRole('textbox', { name: /Model/ }).fill(modelPrefix);

  // Fill purchase date
  await page.getByRole('textbox', { name: /Data zakupu/ }).fill('01/01/2026');
  await page.keyboard.press('Escape');

  // Fill reason if provided
  if (reason) {
    await page.getByRole('textbox', { name: /Opis usterki/ }).fill(reason);
  }

  // Upload image
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /Wybierz zdjęcie/ }).click(),
  ]);
  await fileChooser.setFiles(TEST_JPEG_PATH);

  // Submit
  await page.getByRole('button', { name: /Wyślij zgłoszenie/ }).click();
}
