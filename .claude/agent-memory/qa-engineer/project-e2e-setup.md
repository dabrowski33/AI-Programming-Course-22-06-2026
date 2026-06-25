---
name: project-e2e-setup
description: E2E test stack location, how to run, key patterns learned from Phase 5 QA setup
metadata:
  type: project
---

E2E test suite is at `app/e2e/` using Playwright + TypeScript targeting Chromium headless.

**Why:** Real stack, nothing mocked except LLM (stubbed via `stub-llm` Spring Boot profile).

**How to apply:** Run with:
```bash
cd app/e2e && npx playwright test
```
Requires backend (`./mvnw spring-boot:run -Dspring-boot.run.profiles=stub-llm`) and frontend (`npm start`) already running.

Key files:
- `app/e2e/playwright.config.ts` — baseURL=http://localhost:4200, workers=1 (stateful backend)
- `app/e2e/tests/helpers.ts` — `fillAndSubmitForm()` reusable helper
- `app/e2e/tests/happy-path.spec.ts` — Reklamacja + Zwrot full flows
- `app/e2e/tests/validation.spec.ts` — empty form, missing reason, missing image
- `app/e2e/tests/decision-categories.spec.ts` — all 4 stub categories

StubLlmGateway category routing (model name prefix):
- `ELIGIBLE:*` → Kwalifikuje się
- `NOT_ELIGIBLE:*` → Nie kwalifikuje się
- `NEEDS_HUMAN_REVIEW:*` → Wymaga weryfikacji
- `MORE_INFO_REQUIRED:*` → Wymagane dodatkowe informacje
- (default) → ELIGIBLE

Disclaimer text to assert: `wstępna, automatyczna ocena` (from MessageComposer.DISCLAIMER).
