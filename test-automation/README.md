# Pay UI Test Automation

End-to-end regression testing for Pay UI using Playwright.

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Setup

```bash
cd test-automation
npm ci
npx playwright install --with-deps
```

---

## Environment Variables

Set these in .env file for correspoding env (or configure in GitHub Secrets for CI):


TEST_USERNAME_BCSC=your_bcsc_username
TEST_PASSWORD_BCSC=your_bcsc_password
TEST_USERNAME_IDIR=your_idir_username
TEST_PASSWORD_IDIR=your_idir_password


## Running Tests

```bash
# Run all regression tests (by default it will run with IDIR login)
npm run e2e:regression:test

# Run with specific login method
LOGIN_TYPE=bcsc npm run e2e:regression:test

## Reports

```bash
# Allure report
npm run allure:generate
npm run allure:open

# Playwright HTML report
npx playwright show-report
```

---

## Folder Structure

```
test-automation/
├── tests/              # Test spec files
├── pages/              # Page Object Models
├── env/                # Environment configs (.env.test, .env.dev)
├── fixtures.js         # Playwright fixtures
├── globalSetup.js      # Auth setup (runs before all tests)
└── playwright.config.js
```

---

## CI/CD (GitHub Actions)

Tests run automatically **Monday–Friday at 11 AM EST** and can also be triggered manually via the Actions tab.

**Required GitHub Secrets:**
- `TEST_USERNAME_BCSC`
- `TEST_PASSWORD_BCSC`
- `TEST_USERNAME_IDIR`
- `TEST_PASSWORD_IDIR`

Go to **Settings → Secrets and variables → Actions** to add them.

---

## Adding New Tests

1. Create a `.spec.js` file in `tests/`
2. Tag with `@regression` to include in the regression suite
3. Use page objects from `pages/` for reusability

```javascript
import { test } from '../fixtures.js';

test.describe('Feature Name @regression', () => {
    test('should do something', async ({ page }) => {
        // test code
    });
});
```

---

