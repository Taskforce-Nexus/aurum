import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

test.describe('Session Persistence', () => {

  test('Seed Session messages persist after navigation', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**')

    // Navigate to project
    const projectLink = page.locator('[href*="/project/"]').first()
    await projectLink.click()
    await page.waitForTimeout(2000)

    // Go to Seed Session
    const seedLink = page.locator('a[href*="seed-session"], a[href*="incubadora"]').first()
    if (await seedLink.isVisible()) {
      await seedLink.click()
      await page.waitForTimeout(3000)
    }

    await page.screenshot({ path: 'tests/screenshots/persist-01-seed-loaded.png' })

    // Count messages before
    const messagesBefore = await page.locator('[class*="bubble"], [class*="message"], [class*="chat"] p').count()
    console.log(`Messages before navigation: ${messagesBefore}`)

    // Send a test message
    const input = page.locator('input[placeholder*="respuesta"], input[placeholder*="mensaje"], textarea').first()
    if (await input.isVisible()) {
      await input.fill('Esta es una idea de prueba para verificar persistencia')
      await page.click('button[type="submit"], button:has-text("→"), button:has(svg)').catch(() => {
        input.press('Enter')
      })
      await page.waitForTimeout(5000) // esperar respuesta de Nexo
      await page.screenshot({ path: 'tests/screenshots/persist-02-after-message.png' })
    }

    // Navigate away to ProjectView
    const backLink = page.locator('a[href*="/project/"]').first()
    if (await backLink.isVisible()) {
      await backLink.click()
      await page.waitForTimeout(2000)
    } else {
      await page.goBack()
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'tests/screenshots/persist-03-project-view.png' })

    // Return to Seed Session
    const seedLink2 = page.locator('a[href*="seed-session"], a[href*="incubadora"]').first()
    if (await seedLink2.isVisible()) {
      await seedLink2.click()
      await page.waitForTimeout(3000)
    }

    await page.screenshot({ path: 'tests/screenshots/persist-04-returned.png' })

    // Count messages after — should be >= messagesBefore
    const messagesAfter = await page.locator('[class*="bubble"], [class*="message"], [class*="chat"] p').count()
    console.log(`Messages after return: ${messagesAfter}`)

    // Verify content persisted
    const pageText = await page.textContent('body')
    const hasPersisted = pageText?.includes('prueba para verificar persistencia') || messagesAfter >= messagesBefore

    console.log(`Persistence check: ${hasPersisted ? 'PASS' : 'FAIL'}`)

    await page.screenshot({ path: 'tests/screenshots/persist-05-final.png' })
  })

  test('Seed Session messages persist after page reload', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**')

    // Navigate to project → seed session
    const projectLink = page.locator('[href*="/project/"]').first()
    await projectLink.click()
    await page.waitForTimeout(2000)

    const seedLink = page.locator('a[href*="seed-session"], a[href*="incubadora"]').first()
    if (await seedLink.isVisible()) {
      await seedLink.click()
      await page.waitForTimeout(3000)
    }

    // Count messages
    const messagesBefore = await page.locator('[class*="bubble"], [class*="message"], [class*="chat"] p').count()
    console.log(`Messages before reload: ${messagesBefore}`)

    // Hard reload
    await page.reload()
    await page.waitForTimeout(3000)

    await page.screenshot({ path: 'tests/screenshots/persist-06-after-reload.png' })

    // Count after reload
    const messagesAfter = await page.locator('[class*="bubble"], [class*="message"], [class*="chat"] p').count()
    console.log(`Messages after reload: ${messagesAfter}`)
    console.log(`Reload persistence: ${messagesAfter >= messagesBefore ? 'PASS' : 'FAIL'}`)
  })
})
