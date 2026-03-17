import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

test.describe('Full App Audit', () => {
  let projectId: string

  async function login(page: any) {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
  }

  test('Audit: Dashboard buttons', async ({ page }) => {
    await login(page)

    const newProjectBtn = page.locator('text=Nuevo Proyecto').first()
    console.log('+ Nuevo Proyecto visible:', await newProjectBtn.isVisible())

    const menuBtn = page.locator('button').filter({ hasText: /^[⋯…·]$/ }).first()
    console.log('⋯ menu visible:', await menuBtn.isVisible())
    if (await menuBtn.isVisible()) {
      await menuBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/screenshots/audit-dashboard-menu.png' })
    }

    // Capture all links to projects
    const projectLinks = await page.locator('[href*="/project/"]').all()
    if (projectLinks.length > 0) {
      const href = await projectLinks[0].getAttribute('href')
      projectId = href?.split('/project/')[1]?.split('/')[0] || ''
      console.log('Found projectId:', projectId)
    }

    await page.screenshot({ path: 'tests/screenshots/audit-dashboard.png' })
  })

  test('Audit: ProjectView all buttons', async ({ page }) => {
    await login(page)

    const link = page.locator('[href*="/project/"]').first()
    if (await link.isVisible()) {
      const href = await link.getAttribute('href')
      projectId = href?.split('/project/')[1]?.split('/')[0] || ''
      await link.click()
    }
    await page.waitForTimeout(2000)

    const buttons = await page.locator('button, a[href]').all()
    console.log(`\nProjectView has ${buttons.length} interactive elements:`)

    for (const btn of buttons) {
      const text = (await btn.textContent().catch(() => '')).trim()
      const href = await btn.getAttribute('href').catch(() => null)
      const disabled = await btn.getAttribute('disabled').catch(() => null)
      const tag = await btn.evaluate((el: Element) => el.tagName).catch(() => '')
      if (text) {
        console.log(`  [${tag}] "${text.substring(0, 50)}" | href=${href || 'none'} | disabled=${disabled !== null}`)
      }
    }

    await page.screenshot({ path: 'tests/screenshots/audit-projectview.png' })
  })

  test('Audit: Seed Session', async ({ page }) => {
    await login(page)

    const link = page.locator('[href*="/project/"]').first()
    if (await link.isVisible()) await link.click()
    await page.waitForTimeout(1500)

    const seedLink = page.locator('a[href*="seed-session"], a[href*="semilla"]').first()
    if (await seedLink.isVisible()) {
      await seedLink.click()
      await page.waitForTimeout(3000)
    } else {
      await page.goto(`${BASE}/login`)
    }

    const buttons = await page.locator('button, a[href]').all()
    console.log(`\nSeed Session has ${buttons.length} interactive elements:`)
    for (const btn of buttons) {
      const text = (await btn.textContent().catch(() => '')).trim()
      const href = await btn.getAttribute('href').catch(() => null)
      const disabled = await btn.getAttribute('disabled').catch(() => null)
      const tag = await btn.evaluate((el: Element) => el.tagName).catch(() => '')
      if (text) {
        console.log(`  [${tag}] "${text.substring(0, 50)}" | href=${href || 'none'} | disabled=${disabled !== null}`)
      }
    }

    await page.screenshot({ path: 'tests/screenshots/audit-seedsession.png' })
  })

  test('Audit: Settings all tabs', async ({ page }) => {
    await login(page)

    const tabs = ['cuenta', 'facturacion', 'equipo', 'planes', 'notificaciones', 'conexiones']

    for (const tab of tabs) {
      await page.goto(`${BASE}/settings/${tab}`)
      await page.waitForTimeout(2000)

      const buttons = await page.locator('button').all()
      console.log(`\nSettings/${tab}: ${buttons.length} buttons`)
      for (const btn of buttons) {
        const text = (await btn.textContent().catch(() => '')).trim()
        const disabled = await btn.getAttribute('disabled').catch(() => null)
        if (text) {
          console.log(`  "${text.substring(0, 40)}" disabled=${disabled !== null}`)
        }
      }

      await page.screenshot({ path: `tests/screenshots/audit-settings-${tab}.png` })
    }
  })

  test('Audit: Export Center', async ({ page }) => {
    await login(page)

    const link = page.locator('[href*="/project/"]').first()
    if (await link.isVisible()) await link.click()
    await page.waitForTimeout(1500)

    const exportLink = page.locator('a[href*="export"]').first()
    if (await exportLink.isVisible()) {
      await exportLink.click()
      await page.waitForTimeout(2000)
    }

    const buttons = await page.locator('button, a[href]').all()
    console.log(`\nExport Center has ${buttons.length} interactive elements:`)
    for (const btn of buttons) {
      const text = (await btn.textContent().catch(() => '')).trim()
      if (text) console.log(`  "${text.substring(0, 50)}"`)
    }

    await page.screenshot({ path: 'tests/screenshots/audit-export.png' })
  })

  test('Audit: Advisory Board', async ({ page }) => {
    await login(page)

    const link = page.locator('[href*="/project/"]').first()
    if (await link.isVisible()) await link.click()
    await page.waitForTimeout(1500)

    const boardLink = page.locator('a[href*="consejo"]').first()
    if (await boardLink.isVisible()) {
      await boardLink.click()
      await page.waitForTimeout(2000)
    }

    const buttons = await page.locator('button, a[href]').all()
    console.log(`\nAdvisory Board has ${buttons.length} interactive elements:`)
    for (const btn of buttons) {
      const text = (await btn.textContent().catch(() => '')).trim()
      if (text) console.log(`  "${text.substring(0, 50)}"`)
    }

    await page.screenshot({ path: 'tests/screenshots/audit-board.png' })
  })

  test('Audit: Consultoría', async ({ page }) => {
    await login(page)

    const link = page.locator('[href*="/project/"]').first()
    if (await link.isVisible()) await link.click()
    await page.waitForTimeout(1500)

    const consultLink = page.locator('a[href*="consultoria"]').first()
    if (await consultLink.isVisible()) {
      await consultLink.click()
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'tests/screenshots/audit-consultoria.png' })
    const pageText = await page.textContent('body')
    console.log('\nConsultoría loaded:', pageText?.includes('Consultoría') || pageText?.includes('Completa'))
  })

  test('Audit: Document Viewer', async ({ page }) => {
    await login(page)

    const link = page.locator('[href*="/project/"]').first()
    if (await link.isVisible()) await link.click()
    await page.waitForTimeout(1500)

    const docLink = page.locator('a[href*="/documento/"]').first()
    if (await docLink.isVisible()) {
      await docLink.click()
      await page.waitForTimeout(2000)

      const buttons = await page.locator('button, a[href]').all()
      console.log(`\nDocument Viewer has ${buttons.length} interactive elements:`)
      for (const btn of buttons) {
        const text = (await btn.textContent().catch(() => '')).trim()
        const disabled = await btn.getAttribute('disabled').catch(() => null)
        if (text) console.log(`  "${text.substring(0, 50)}" disabled=${disabled !== null}`)
      }

      await page.screenshot({ path: 'tests/screenshots/audit-document.png' })
    } else {
      console.log('No document links found')
    }
  })
})
