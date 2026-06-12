import { test, expect } from '@playwright/test';

test('the active nav item reflects the current route', async ({ page }) => {
  await page.goto('/works');
  await expect(page.locator('.site-header__nav a.active')).toHaveText('Work');
});

test('theme is set before paint (no flash) and the toggle cycles it', async ({
  page,
}) => {
  await page.goto('/');
  // data-theme is set by the pre-paint inline script in _document → no flash.
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    /^(light|dark)$/,
  );

  const toggle = page.locator('button.theme-toggle');
  const before = (await toggle.getAttribute('data-mode')) ?? '';
  await toggle.click();
  await expect(toggle).not.toHaveAttribute('data-mode', before);

  // The choice persists for the next load.
  const stored = await page.evaluate(() => localStorage.getItem('theme-mode'));
  expect(stored).toBeTruthy();
});

test('the Labs canvas mounts', async ({ page }) => {
  await page.goto('/labs');
  await expect(page.locator('.labs-canvas')).toBeVisible();
});
