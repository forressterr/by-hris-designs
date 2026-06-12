import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/works', name: 'works' },
  { path: '/works/surge', name: 'case study' },
  { path: '/about', name: 'about' },
  { path: '/labs', name: 'labs' },
  { path: '/contact', name: 'contact' },
];

for (const route of ROUTES) {
  test(`${route.name} (${route.path}) loads and renders`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/By Hris/);
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
  });
}

test('the works grid renders project cards', async ({ page }) => {
  await page.goto('/works');
  await expect(page.locator('.project-card').first()).toBeVisible();
});

test('a case study renders its title', async ({ page }) => {
  await page.goto('/works/surge');
  await expect(page.locator('.project-hero__title')).toContainText('Surge');
});

test('an unknown route returns 404', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
});
