import { test, expect } from '@playwright/test'
import { seedTestData } from './setup'

const BASE = 'http://localhost:3000'

const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

let projectId: string

test.beforeAll(async () => {
  projectId = await seedTestData()
})

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")')
  await page.waitForURL('**/dashboard**', { timeout: 20000 })
}

test.describe('Reason E2E', () => {

  test('1. Landing page loads', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('text=Crear cuenta gratis').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/01-landing.png' })
  })

  test('2. Login works', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**', { timeout: 20000 })
    await page.screenshot({ path: 'tests/screenshots/02-dashboard.png' })
  })

  test('3. Dashboard shows projects', async ({ page }) => {
    await login(page)
    await expect(page.locator('text=Nuevo Proyecto').first()).toBeVisible()
    await expect(page.locator('text=FinTrack').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/03-dashboard-projects.png' })
  })

  test('4. ProjectView loads with FinTrack', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=FinTrack').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/04-project-view.png' })
  })

  test('5. Semilla / Incubadora loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/incubadora`)
    await page.waitForLoadState('networkidle')
    // SeedSessionFlow always renders "Sesión Semilla" header
    await expect(page.locator('text=Sesión Semilla').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/05-semilla.png' })
  })

  test('6. Export Center loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/export`)
    await page.waitForLoadState('networkidle')
    // ExportCenter always renders "Centro de Exportación"
    await expect(page.locator('text=Centro de Exportación').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/06-export.png' })
  })

  test('7. Advisory Board loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/consejo`)
    await page.waitForLoadState('networkidle')
    // MyBoard always renders "Consejo Asesor"
    await expect(page.locator('text=Consejo Asesor').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/07-board.png' })
  })

  test('8. Settings Account loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/settings/cuenta`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/08-settings.png' })
  })

  test('9. Consultoría loads with history', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/consultoria`)
    await page.waitForLoadState('networkidle')
    // ConsultoriaView always renders "Consultoría Activa"
    await expect(page.locator('text=Consultoría Activa').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/09-consultoria.png' })
  })
})
