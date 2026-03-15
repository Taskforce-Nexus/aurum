import { test } from '@playwright/test'

const BASE = 'http://localhost:3000'

test('Screenshot all screens', async ({ page }) => {
  test.setTimeout(60000)

  // Login
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'tests/screenshots/screen-login.png', fullPage: true })

  await page.fill('input[type="email"]', 'e2e@reason.test')
  await page.fill('input[type="password"]', 'E2eReason2026x')
  await page.click('button:has-text("Iniciar Sesión")')
  await page.waitForURL('**/dashboard**')
  await page.waitForTimeout(1500)

  // Dashboard
  await page.screenshot({ path: 'tests/screenshots/screen-dashboard.png', fullPage: true })

  // ProjectView (first project = FinTrack)
  const project = page.locator('[href*="/project/"]').first()
  if (await project.isVisible()) {
    await project.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/screenshots/screen-projectview.png', fullPage: true })
  }

  // Seed Session (VoiceTest — no founder_brief → IncubadoraChat)
  await page.goto(`${BASE}/dashboard`)
  await page.waitForTimeout(1500)
  const voiceTestLink = page.locator('text=VoiceTest').first()
  if (await voiceTestLink.isVisible()) {
    await voiceTestLink.click()
    await page.waitForTimeout(1500)
    const projectId = page.url().split('/project/')[1]?.split('/')[0]
    if (projectId) {
      await page.goto(`${BASE}/project/${projectId}/seed-session`)
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'tests/screenshots/screen-seed-session.png', fullPage: true })
    }
  }

  // Landing (logged-in user redirects to dashboard — skip here)
})

test('Landing page (no auth)', async ({ browser }) => {
  test.setTimeout(30000)

  // Fresh context — no cookies, no session
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:3000')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'tests/screenshots/screen-landing-real.png', fullPage: true })

  await context.close()
})
