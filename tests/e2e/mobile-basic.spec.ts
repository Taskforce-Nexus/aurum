import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const MOBILE = { width: 375, height: 812 }

test.describe('Mobile responsiveness (375px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
  })

  test('landing page has no horizontal overflow', async ({ page }) => {
    await page.goto(BASE)
    const body = await page.textContent('body') ?? ''
    expect(body.length).toBeGreaterThan(100)

    // Check no horizontal scroll
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    console.log('Landing horizontal overflow:', hasHorizontalOverflow)
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    const body = await page.textContent('body') ?? ''
    expect(body.length).toBeGreaterThan(50)

    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    console.log('Login horizontal overflow:', hasHorizontalOverflow)
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('register page renders correctly on mobile', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    const body = await page.textContent('body') ?? ''
    expect(body.length).toBeGreaterThan(50)

    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    console.log('Register horizontal overflow:', hasHorizontalOverflow)
    expect(hasHorizontalOverflow).toBe(false)
  })
})
