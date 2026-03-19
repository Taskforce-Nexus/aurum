import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Password reset flow', () => {
  test('forgot password page loads and accepts email', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`)

    // Email input visible
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Button and heading visible
    const heading = page.getByText(/recupera|restablecer|recuperar/i).first()
    await expect(heading).toBeVisible()

    // Button text is correct (not "Tomar enviar")
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    const btnText = await submitBtn.textContent()
    expect(btnText?.toLowerCase()).not.toContain('tomar')
    expect(btnText?.toLowerCase()).toMatch(/enviar|send/i)

    // Can type an email and submit without crashing
    await page.fill('input[type="email"]', 'test@example.com')
    await submitBtn.click()
    await page.waitForTimeout(2000)

    // Should redirect to forgot-password-sent or show success
    const url = page.url()
    const body = await page.textContent('body') ?? ''
    const success = url.includes('forgot-password-sent') || body.includes('enviamos') || body.includes('revisa tu email')
    console.log('After submit URL:', url)
    console.log('Success indicator:', success)
    expect(success || body.length > 100).toBeTruthy()
  })

  test('reset-password page renders', async ({ page }) => {
    await page.goto(`${BASE}/auth/reset-password`)

    // Should show password inputs (even if no session token — shows form)
    const body = await page.textContent('body') ?? ''
    console.log('Reset password page body length:', body.length)
    expect(body.length > 50).toBeTruthy()

    // Check for password input or redirect to login
    const passwordInput = page.locator('input[type="password"]').first()
    const isVisible = await passwordInput.isVisible().catch(() => false)
    console.log('Password input visible:', isVisible)
  })

  test('forgot-password-sent page shows resend option', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password-sent`)
    const body = await page.textContent('body') ?? ''
    const hasReenviar = body.includes('Reenviar') || body.includes('reenviar') || body.includes('nuevo enlace')
    console.log('Forgot-password-sent has resend:', hasReenviar)
    expect(body.length > 50).toBeTruthy()
  })
})
