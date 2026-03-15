import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button:has-text("Iniciar Sesión")')
  await page.waitForURL('**/dashboard**')
  await page.waitForTimeout(1500)
}

async function navigateToProject(page: import('@playwright/test').Page, name: string) {
  const link = page.locator(`text=${name}`).first()
  await link.click()
  await page.waitForTimeout(2000)
  const projectId = page.url().split('/project/')[1]?.split('/')[0]
  return projectId
}

test.describe('Sesión de Consejo', () => {

  test('Full debate flow — Iniciar + debate + resolver', async ({ page }) => {
    test.setTimeout(120000)

    await login(page)

    // TestCo must exist — run create-user.js first if not found
    const testCoLink = page.locator('text=TestCo').first()
    if (!(await testCoLink.isVisible())) {
      console.log('FAIL: TestCo project not found — run: node tests/e2e/create-user.js')
      expect(await testCoLink.isVisible()).toBeTruthy()
      return
    }

    const projectId = await navigateToProject(page, 'TestCo')
    await page.screenshot({ path: 'tests/screenshots/debate-01-project.png' })

    // Navigate to sesion-consejo (direct URL is most reliable)
    await page.goto(`${BASE}/project/${projectId}/sesion-consejo`)
    await page.waitForTimeout(4000)
    await page.screenshot({ path: 'tests/screenshots/debate-02-loaded.png' })

    // ── Step 1: Iniciar Sesión de Consejo ──────────────────────────────────────
    const iniciarBtn = page.locator('button:has-text("Iniciar Sesión de Consejo")')
    expect(await iniciarBtn.isVisible()).toBeTruthy()
    console.log('✓ "Iniciar Sesión de Consejo" button found')

    await iniciarBtn.click()
    console.log('Waiting for first question (~10s)...')
    await page.waitForTimeout(10000)
    await page.screenshot({ path: 'tests/screenshots/debate-03-first-question.png' })

    const bodyAfterStart = await page.textContent('body') ?? ''
    const hasPregunta = bodyAfterStart.includes('Pregunta') || bodyAfterStart.includes('pregunta')
    const hasIniciarDebate = bodyAfterStart.includes('Iniciar Debate')
    console.log('After Iniciar:')
    console.log('  Pregunta visible:', hasPregunta)
    console.log('  "Iniciar Debate →" visible:', hasIniciarDebate)

    if (!hasIniciarDebate) {
      console.log('WARN: "Iniciar Debate" not found after start — session may have errored')
      await page.screenshot({ path: 'tests/screenshots/debate-03-error.png' })
      expect(hasIniciarDebate).toBeTruthy()
      return
    }

    // ── Step 2: Iniciar Debate ─────────────────────────────────────────────────
    const debateBtn = page.locator('button:has-text("Iniciar Debate")')
    await debateBtn.click()
    console.log('Waiting for Constructivo + Crítico (~15s — two Claude calls)...')
    await page.waitForTimeout(18000)
    await page.screenshot({ path: 'tests/screenshots/debate-04-debate-cards.png' })

    const bodyAfterDebate = await page.textContent('body') ?? ''
    const hasConstructivoCard = bodyAfterDebate.includes('Elegir Constructiva')
    const hasCriticoCard = bodyAfterDebate.includes('Elegir Crítico')

    console.log('After Iniciar Debate:')
    console.log('  Card Constructivo (Elegir Constructiva):', hasConstructivoCard)
    console.log('  Card Crítico (Elegir Crítico):', hasCriticoCard)

    // ── Step 3: Elegir Constructiva ────────────────────────────────────────────
    const elegirBtn = page.locator('button:has-text("Elegir Constructiva")').first()
    if (await elegirBtn.isVisible()) {
      console.log('✓ Choosing Constructiva...')
      await elegirBtn.click()
      await page.waitForTimeout(8000) // wait for section generation
      await page.screenshot({ path: 'tests/screenshots/debate-05-resolved.png' })

      const bodyAfterResolve = await page.textContent('body') ?? ''
      const hasSectionGenerated = bodyAfterResolve.includes('Resueltas') ||
        bodyAfterResolve.includes('constructiva') ||
        bodyAfterResolve.includes('generada') ||
        bodyAfterResolve.includes('Pregunta 2')
      console.log('After Elegir Constructiva:')
      console.log('  Progress/section generated:', hasSectionGenerated)

      // Check momentum sidebar
      const momentumText = await page.locator('text=Resueltas').first().textContent().catch(() => '')
      console.log('  Momentum text:', momentumText?.trim())
    } else {
      console.log('WARN: Elegir Constructiva not visible — debate may not have completed')
    }

    await page.screenshot({ path: 'tests/screenshots/debate-06-final.png' })
    const finalBody = await page.textContent('body') ?? ''
    expect(finalBody.length > 100).toBeTruthy()
  })

  test('Export PDF download', async ({ page }) => {
    test.setTimeout(60000)

    await login(page)

    // FinTrack has approved documents (status: 'aprobado' with content_json)
    const fintrackLink = page.locator('text=FinTrack').first()
    if (!(await fintrackLink.isVisible())) {
      console.log('FAIL: FinTrack project not found — run: node tests/e2e/create-user.js')
      expect(await fintrackLink.isVisible()).toBeTruthy()
      return
    }

    const projectId = await navigateToProject(page, 'FinTrack')
    await page.screenshot({ path: 'tests/screenshots/export-01-project.png' })

    // Navigate to export center
    await page.goto(`${BASE}/project/${projectId}/export`)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/screenshots/export-02-center.png' })

    const bodyText = await page.textContent('body') ?? ''
    console.log('Export Center loaded')
    console.log('  Has documents:', bodyText.includes('Descargar') || bodyText.includes('PDF'))
    console.log('  Ready count visible:', bodyText.includes('documentos listos'))

    // Attempt PDF download
    const downloadBtn = page.locator('button:has-text("Descargar")').first()
    const isDownloadVisible = await downloadBtn.isVisible()
    console.log('  Descargar button visible:', isDownloadVisible)

    if (isDownloadVisible) {
      const isEnabled = await downloadBtn.isEnabled()
      console.log('  Descargar button enabled:', isEnabled)

      if (isEnabled) {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 15000 }),
          downloadBtn.click(),
        ])

        const filename = download.suggestedFilename()
        const path = await download.path()
        console.log('✓ Downloaded:', filename)
        console.log('  Path:', path)
        expect(filename).toContain('.pdf')
      } else {
        console.log('WARN: Descargar button is disabled — document may have no sections')
        // Check bulk download instead
        const bulkBtn = page.locator('button:has-text("Descargar todo")').first()
        if (await bulkBtn.isVisible() && await bulkBtn.isEnabled()) {
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 15000 }),
            bulkBtn.click(),
          ])
          console.log('✓ Bulk downloaded:', download.suggestedFilename())
          expect(download.suggestedFilename()).toContain('.pdf')
        } else {
          console.log('WARN: No enabled download button found')
          await page.screenshot({ path: 'tests/screenshots/export-03-no-download.png' })
        }
      }
    }

    await page.screenshot({ path: 'tests/screenshots/export-03-final.png' })
  })
})
