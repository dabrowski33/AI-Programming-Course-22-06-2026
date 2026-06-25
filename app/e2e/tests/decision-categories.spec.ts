import { test, expect } from '@playwright/test';
import { fillAndSubmitForm } from './helpers';

/**
 * StubLlmGateway routes by model name prefix:
 *   ELIGIBLE:*         → "Kwalifikuje się"
 *   NOT_ELIGIBLE:*     → "Nie kwalifikuje się"
 *   NEEDS_HUMAN_REVIEW:* → "Wymaga weryfikacji przez konsultanta"
 *   MORE_INFO_REQUIRED:* → "Wymagane dodatkowe informacje"
 *   (default)          → ELIGIBLE
 *
 * The mandatory disclaimer is appended deterministically by MessageComposer
 * for every category (TAC-003-08 / AC-24 / TAC-001-04).
 */

const DISCLAIMER_FRAGMENT = 'wstępna, automatyczna ocena';

const CATEGORIES = [
  {
    prefix: 'ELIGIBLE:Test',
    expectedDecisionText: 'Kwalifikuje się',
    tag: '@eligible',
  },
  {
    prefix: 'NOT_ELIGIBLE:Test',
    expectedDecisionText: 'Nie kwalifikuje się',
    tag: '@not-eligible',
  },
  {
    prefix: 'NEEDS_HUMAN_REVIEW:Test',
    expectedDecisionText: 'Wymaga weryfikacji',
    tag: '@needs-human-review',
  },
  {
    prefix: 'MORE_INFO_REQUIRED:Test',
    expectedDecisionText: 'dodatkowe informacje',
    tag: '@more-info-required',
  },
] as const;

test.describe('All 4 decision categories via StubLlmGateway', () => {
  for (const { prefix, expectedDecisionText } of CATEGORIES) {
    test(`decision category: ${prefix.split(':')[0]}`, async ({ page }) => {
      await fillAndSubmitForm(page, {
        type: 'ZWROT',
        modelPrefix: prefix,
      });

      // Must navigate to chat
      await expect(page).toHaveURL(/\/chat\/.+/, { timeout: 15_000 });

      // Decision text visible somewhere on the page
      await expect(page.locator('body')).toContainText(expectedDecisionText, { timeout: 15_000 });

      // Disclaimer always present regardless of category (TAC-003-08 / AC-24)
      await expect(page.locator('body')).toContainText(DISCLAIMER_FRAGMENT, { timeout: 5_000 });

      // Case summary header shows the decision badge
      await expect(page.locator('.decision-badge')).toBeVisible();
    });
  }
});
