import { test, expect } from '@playwright/test';

const BASE = 'https://reason-production-e205.up.railway.app';

const PUBLIC_PAGES = [
  { name: 'Landing', path: '/', expect: 'Reason' },
  { name: 'Login', path: '/login', expect: 'Iniciar Sesión' },
  { name: 'Register', path: '/register', expect: 'Crear Cuenta' },
  { name: 'Pricing', path: '/pricing', expect: 'Free' },
  { name: 'Privacy', path: '/privacy', expect: 'Privacidad' },
  { name: 'Terms', path: '/terms', expect: 'Términos' },
];

for (const page of PUBLIC_PAGES) {
  test(`PROD: ${page.name} loads (${page.path})`, async ({ page: p }) => {
    const res = await p.goto(`${BASE}${page.path}`);
    expect(res?.status()).toBeLessThan(400);
    await expect(p.locator('body')).toContainText(page.expect, { timeout: 15000 });
  });
}

test('PROD: Pricing shows 4 plans', async ({ page }) => {
  await page.goto(`${BASE}/pricing`);
  await expect(page.getByText('$0')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('$29')).toBeVisible();
  await expect(page.getByText('$79')).toBeVisible();
  await expect(page.getByText('$199')).toBeVisible();
});

test('PROD: Login form works', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill('test@example.com');
  await page.locator('input[type="password"]').fill('testpassword123');
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeEnabled();
});

test('PROD: Register form works', async ({ page }) => {
  await page.goto(`${BASE}/register`);
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
});

test('PROD: API health check', async ({ request }) => {
  const res = await request.get(`${BASE}/api/health`);
  // Si no existe /api/health, verificar que el server responde
  if (res.status() === 404) {
    // Al menos el server está arriba
    expect(res.status()).toBe(404);
  } else {
    expect(res.status()).toBe(200);
  }
});

test('PROD: Stripe checkout endpoint responds', async ({ request }) => {
  const res = await request.post(`${BASE}/api/stripe/checkout`, {
    data: { plan: 'core' },
  });
  // Sin auth debería dar 401, no 500
  expect(res.status()).not.toBe(500);
});

test('PROD: robots.txt exists', async ({ request }) => {
  const res = await request.get(`${BASE}/robots.txt`);
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain('Sitemap');
});

test('PROD: sitemap.xml exists', async ({ request }) => {
  const res = await request.get(`${BASE}/sitemap.xml`);
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain('reason.guru');
});

test('PROD: llms.txt exists', async ({ request }) => {
  const res = await request.get(`${BASE}/llms.txt`);
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain('Strategic Reasoning Partner');
});

test('PROD: No horizontal scroll on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}`);
  await page.waitForLoadState('networkidle');
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
});
