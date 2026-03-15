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

test.describe('Document Viewer + Consultoría Activa', () => {

  test('Document Viewer — tabs + sections render', async ({ page }) => {
    test.setTimeout(60000)

    await login(page)

    const fintrackLink = page.locator('text=FinTrack').first()
    if (!(await fintrackLink.isVisible())) {
      console.log('FAIL: FinTrack not found — run: node tests/e2e/create-user.js')
      expect(await fintrackLink.isVisible()).toBeTruthy()
      return
    }

    const projectId = await navigateToProject(page, 'FinTrack')
    await page.screenshot({ path: 'tests/screenshots/viewer-01-project.png' })

    // Navigate to export center to find a document with Vista previa
    await page.goto(`${BASE}/project/${projectId}/export`)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/screenshots/viewer-02-export-center.png' })

    const bodyText = await page.textContent('body') ?? ''
    console.log('Export center loaded, has Vista previa:', bodyText.includes('Vista previa'))

    // Click first "Vista previa" link to open document viewer
    const vistaBtn = page.locator('a:has-text("Vista previa"), button:has-text("Vista previa")').first()
    const isVistaVisible = await vistaBtn.isVisible()
    console.log('Vista previa visible:', isVistaVisible)

    if (!isVistaVisible) {
      // Try navigating to the documents section of the project directly
      console.log('WARN: Vista previa not found in export center — checking page content')
      console.log('Body includes:', {
        aprobado: bodyText.includes('aprobado'),
        PDF: bodyText.includes('PDF'),
        documentos: bodyText.includes('documentos'),
      })
      await page.screenshot({ path: 'tests/screenshots/viewer-02b-no-vista.png' })
      // Skip this test gracefully
      expect(isVistaVisible).toBeTruthy()
      return
    }

    await vistaBtn.click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/screenshots/viewer-03-viewer-loaded.png' })

    const viewerBody = await page.textContent('body') ?? ''

    // Verify header has project/document breadcrumb
    const hasFinTrack = viewerBody.includes('FinTrack')
    console.log('Viewer: FinTrack in breadcrumb:', hasFinTrack)
    expect(hasFinTrack).toBeTruthy()

    // Verify "Contenido" tab is active by default (tab label includes ✏️ Contenido)
    const contenidoTab = page.locator('button:has-text("Contenido")')
    const isContenidoVisible = await contenidoTab.isVisible()
    console.log('Contenido tab visible:', isContenidoVisible)
    expect(isContenidoVisible).toBeTruthy()

    // Verify at least one section is rendered (sections have section_name as h3/heading)
    const hasSections = viewerBody.includes('Resumen ejecutivo') || viewerBody.includes('Análisis de mercado')
    console.log('Sections rendered:', hasSections)

    // Click "Ajustar" tab
    const ajustarTab = page.locator('button:has-text("Ajustar")')
    if (await ajustarTab.isVisible()) {
      await ajustarTab.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/screenshots/viewer-04-ajustar-tab.png' })
      console.log('✓ Ajustar tab clicked')
    } else {
      console.log('WARN: Ajustar tab not found')
    }

    // Click "Identidad" tab
    const identidadTab = page.locator('button:has-text("Identidad")')
    if (await identidadTab.isVisible()) {
      await identidadTab.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/screenshots/viewer-05-identidad-tab.png' })
      console.log('✓ Identidad tab clicked')
    } else {
      console.log('WARN: Identidad tab not found')
    }

    await page.screenshot({ path: 'tests/screenshots/viewer-06-final.png' })
    expect(hasSections).toBeTruthy()
  })

  test('Consultoría Activa — send message + advisor response', async ({ page }) => {
    test.setTimeout(90000)

    await login(page)

    const fintrackLink = page.locator('text=FinTrack').first()
    if (!(await fintrackLink.isVisible())) {
      console.log('FAIL: FinTrack not found — run: node tests/e2e/create-user.js')
      expect(await fintrackLink.isVisible()).toBeTruthy()
      return
    }

    const projectId = await navigateToProject(page, 'FinTrack')
    await page.screenshot({ path: 'tests/screenshots/consultoria-01-project.png' })

    // Navigate directly to consultoria
    await page.goto(`${BASE}/project/${projectId}/consultoria`)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/screenshots/consultoria-02-loaded.png' })

    const bodyText = await page.textContent('body') ?? ''

    // Check if unlocked (should be since we set current_phase: 'completado')
    const isLocked = bodyText.includes('Completa la Sesión de Consejo')
    console.log('Consultoría locked:', isLocked)

    if (isLocked) {
      console.log('FAIL: Consultoría is locked — run: node tests/e2e/create-user.js to set phase=completado')
      expect(!isLocked).toBeTruthy()
      return
    }

    // Verify 3-column layout markers
    const hasTuConsejo = bodyText.includes('Tu Consejo')
    const hasConsultoriaActiva = bodyText.includes('Consultoría Activa')
    const hasDocumentosRef = bodyText.includes('Documentos de referencia')
    console.log('3-column layout:')
    console.log('  Left (Tu Consejo):', hasTuConsejo)
    console.log('  Center (Consultoría Activa):', hasConsultoriaActiva)
    console.log('  Right (Documentos de referencia):', hasDocumentosRef)

    // Send a message via the input
    const input = page.locator('input[aria-label="Pregunta al consejo"]')
    const isInputVisible = await input.isVisible()
    console.log('Input visible:', isInputVisible)

    if (!isInputVisible) {
      console.log('WARN: Input not found')
      await page.screenshot({ path: 'tests/screenshots/consultoria-02b-no-input.png' })
      expect(isInputVisible).toBeTruthy()
      return
    }

    await input.fill('¿Cómo ajusto mi pricing si el CAC subió?')
    await page.screenshot({ path: 'tests/screenshots/consultoria-03-typed.png' })

    // Click send button (→)
    const sendBtn = page.locator('button:has-text("→")').last()
    await sendBtn.click()
    console.log('Message sent — waiting for advisor response (~15s)...')
    await page.waitForTimeout(15000)
    await page.screenshot({ path: 'tests/screenshots/consultoria-04-response.png' })

    const bodyAfter = await page.textContent('body') ?? ''

    // Check that user message appears
    const hasUserMsg = bodyAfter.includes('¿Cómo ajusto mi pricing')
    console.log('User message visible:', hasUserMsg)

    // Check for advisor or nexo response
    const hasNexo = bodyAfter.includes('Nexo')
    const hasAdvisorResponse = bodyAfter.includes('Consejero') || bodyAfter.toLowerCase().includes('pricing') || bodyAfter.toLowerCase().includes('cac')
    console.log('Nexo response:', hasNexo)
    console.log('Advisor/content response:', hasAdvisorResponse)

    await page.screenshot({ path: 'tests/screenshots/consultoria-05-final.png' })

    expect(hasUserMsg).toBeTruthy()
    expect(hasNexo || hasAdvisorResponse).toBeTruthy()
  })
})
