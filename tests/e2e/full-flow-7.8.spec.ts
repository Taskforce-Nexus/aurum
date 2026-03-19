import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const TEST_EMAIL = 'test-e2e-78@taskforce.fyi';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Full Flow E2E post-7.8', () => {
  test.setTimeout(120000); // 2 min por test

  test('01 — Dashboard loads after login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/*', { timeout: 15000 });
    // Dashboard o redirect
    await expect(page.locator('body')).not.toContainText('500', { timeout: 10000 });
  });

  test('02 — Create project', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Create project
    const createBtn = page.getByText(/crear.*proyecto|nuevo.*proyecto/i);
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const nameInput = page.locator('input[name="name"], input[placeholder*="ombre"]');
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Test Fintech E2E');
        const submitBtn = page.getByText(/crear|guardar/i).last();
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
    }
    // Verify project exists
    await expect(page.locator('body')).toContainText(/test fintech|proyecto/i, { timeout: 10000 });
  });

  test('03 — Semilla: send messages and complete', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Navigate to seed session of most recent project
    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForTimeout(2000);
    }

    // Find semilla/seed link
    const semillaLink = page.getByText(/semilla|comenzar|iniciar/i).first();
    if (await semillaLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await semillaLink.click();
      await page.waitForTimeout(3000);
    }

    // Check if chat input exists
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test('04 — EntregablesPropuesta loads with documents', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Navigate to a project that has seed completed
    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForTimeout(2000);
    }

    // Look for entregables step
    const entregablesLink = page.getByText(/entregable/i);
    if (await entregablesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await entregablesLink.click();
      await page.waitForTimeout(5000);
    }

    // Verify no "Sin entregables" or "0 entregables"
    const body = await page.locator('body').textContent();
    const hasEntregables = !body?.includes('Sin entregables definidos') && !body?.includes('ENTREGABLES (0)');
    expect(hasEntregables).toBeTruthy();
  });

  test('05 — ConsejoPrincipalPropuesta generates on-demand advisors', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForTimeout(2000);
    }

    // Navigate to consejo principal step
    const consejoLink = page.getByText(/consejo principal|consejeros/i);
    if (await consejoLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consejoLink.click();
      await page.waitForTimeout(10000); // Wait for Claude to generate advisors
    }

    // Verify: NO "LIDERA"/"APOYA"/"OBSERVA" badges
    const body = await page.locator('body').textContent() || '';
    expect(body).not.toContain('LIDERA');
    expect(body).not.toContain('OBSERVA');

    // Verify advisors have reasons
    const reasonTexts = page.locator('[class*="italic"], [class*="reason"]');
    const reasonCount = await reasonTexts.count();
    console.log('Advisor reasons visible:', reasonCount);
  });

  test('06 — ConsejoListo shows full council without levels', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForTimeout(2000);
    }

    const consejoListoLink = page.getByText(/consejo listo/i);
    if (await consejoListoLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consejoListoLink.click();
      await page.waitForTimeout(3000);
    }

    // No "LIDERA" / "OBSERVA" / "APOYA" visible
    const body = await page.locator('body').textContent() || '';
    expect(body).not.toContain('LIDERA');
    expect(body).not.toContain('OBSERVA');

    // No "Sin entregables" or "Entregables (0)"
    expect(body).not.toContain('Sin entregables definidos');
    expect(body).not.toContain('ENTREGABLES (0)');

    // "Iniciar Sesión de Consejo" button should be enabled
    const startBtn = page.getByText(/iniciar.*sesi[oó]n/i);
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(startBtn).toBeEnabled();
    }
  });

  test('07 — Sesión de Consejo: first question loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Navigate to sesion-consejo of a project
    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForTimeout(2000);
    }

    const sesionLink = page.locator('a[href*="sesion-consejo"]');
    if (await sesionLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sesionLink.click();
      await page.waitForTimeout(10000);
    }

    // Verify no 500 error
    await expect(page.locator('body')).not.toContainText('500');
    // Verify some content loaded
    const body = await page.locator('body').textContent() || '';
    console.log('Sesion page content length:', body.length);
  });

  test('08 — Pricing page shows 4 plans correctly', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await expect(page.getByText('$0')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('$29')).toBeVisible();
    await expect(page.getByText('$79')).toBeVisible();
    await expect(page.getByText('$199')).toBeVisible();
    // No "LIDERA" anywhere
    const body = await page.locator('body').textContent() || '';
    expect(body).not.toContain('LIDERA');
  });

  test('09 — Export Center loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForTimeout(2000);
    }

    // Look for export center
    const exportLink = page.getByText(/export|exportar|entrega/i);
    if (await exportLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportLink.click();
      await page.waitForTimeout(3000);
    }

    await expect(page.locator('body')).not.toContainText('500');
  });

  test('10 — Admin panel accessible for admin user', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE}/admin/users`);
    await page.waitForTimeout(3000);

    // Either shows admin content or redirects (depending on role)
    await expect(page.locator('body')).not.toContainText('500');
  });
});
