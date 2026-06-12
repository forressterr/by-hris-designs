import { test, expect, type Page, type Locator } from '@playwright/test';

// The contact form appears on /contact (and in the footer); `.first()` targets
// one. Every test stubs /api/contact so CI never sends a real email or writes
// to Redis.
function contactForm(page: Page): Locator {
  return page.locator('form.contact-form').first();
}

async function fillValid(form: Locator): Promise<void> {
  await form.locator('input[name="name"]').fill('Test Person');
  await form.locator('input[name="email"]').fill('test@example.com');
  await form
    .locator('textarea[name="message"]')
    .fill('A test enquiry, plain text.');
}

test('shows validation errors on an empty submit', async ({ page }) => {
  await page.goto('/contact');
  const form = contactForm(page);
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('.field__error').first()).toBeVisible();
});

test('submits successfully (stubbed) → success state', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.goto('/contact');
  const form = contactForm(page);
  await fillValid(form);
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('button[type="submit"]')).toHaveText(/Sent/);
});

test('server rejection (stubbed) → error state', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'Nope.' }),
    }),
  );
  await page.goto('/contact');
  const form = contactForm(page);
  await fillValid(form);
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('button[type="submit"]')).toHaveText(/try again/i);
});
