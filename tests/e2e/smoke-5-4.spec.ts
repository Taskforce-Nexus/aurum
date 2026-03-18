/**
 * Story 5.4 — Smoke Test: Sesión de Consejo end-to-end
 *
 * Objetivo: Verificar que un usuario puede completar el flujo completo
 * Semilla → Entregables → Sesión de Consejo → Export sin errores.
 *
 * REGLA: Este test DOCUMENTA bugs, NO los corrige.
 * Los logs de consola detallan cada hallazgo.
 */

import { test, expect, type Page } from '@playwright/test'

const BASE          = 'http://localhost:3000'
const TEST_EMAIL    = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'
// SmokeTest Session: 1 documento "Validacion de Mercado" con composition real
const SMOKE_PROJECT_ID = '06a3f55a-438f-4001-ae1c-68e4c2b3007e'

const BUGS: string[] = []

function logBug(id: string, desc: string) {
  const msg = `[BUG-${id}] ${desc}`
  BUGS.push(msg)
  console.log('🐛 ' + msg)
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 20000 })
}

test.describe('Story 5.4 — Smoke Test completo', () => {

  test('SMK-01: Login y dashboard cargan', async ({ page }) => {
    await page.goto(BASE)
    const bodyText = await page.textContent('body') ?? ''
    const hasLanding = bodyText.includes('Reason') || bodyText.includes('crear') || bodyText.includes('cuenta')
    console.log('Landing carga:', hasLanding)
    if (!hasLanding) logBug('01a', 'Landing page vacía o error')
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-01-landing.png' })

    await login(page)
    const dashBody = await page.textContent('body') ?? ''
    const hasDashboard = dashBody.includes('Proyecto') || dashBody.includes('proyecto') || dashBody.includes('Nuevo')
    console.log('Dashboard carga:', hasDashboard)
    if (!hasDashboard) logBug('01b', 'Dashboard vacío o error tras login')
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-01-dashboard.png' })
    expect(hasDashboard).toBeTruthy()
  })

  test('SMK-02: ProjectView — estado del proyecto', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${SMOKE_PROJECT_ID}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // allow hydration to complete
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-02-projectview.png' })

    const bodyText = await page.textContent('body') ?? ''
    // Check tiles — real crash only if main content doesn't render
    const hasSeeds = bodyText.includes('Semilla')
    const hasEntregables = bodyText.includes('Entregable') || bodyText.includes('Export')
    const hasConsejo = bodyText.includes('Consejo') || bodyText.includes('sesion')
    console.log('Tiles visibles — Semilla:', hasSeeds, '| Entregables:', hasEntregables, '| Consejo:', hasConsejo)

    if (!hasSeeds) logBug('02b', 'Tile Semilla no visible en ProjectView')
    if (!hasEntregables) logBug('02c', 'Tile Entregables/Export no visible en ProjectView')
    if (!hasConsejo) logBug('02d', 'Tile Consejo Asesor no visible en ProjectView')

    expect(hasSeeds && hasEntregables).toBeTruthy()
  })

  test('SMK-03: Sesión de Consejo — página carga', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${SMOKE_PROJECT_ID}/sesion-consejo`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // allow hydration to complete
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-03-sesion-init.png' })

    const bodyText = await page.textContent('body') ?? ''
    const hasCrash = bodyText.includes('Internal Server Error') ||
      (bodyText.includes('Application error') && !bodyText.includes('Iniciar'))
    if (hasCrash) logBug('03a', 'Sesión de Consejo página lanza error fatal')

    // Should show "Iniciar" button since we reset documents to pendiente
    const iniciarBtn = page.locator('button').filter({ hasText: /Iniciar/i })
    const btnCount = await iniciarBtn.count()
    console.log('Botones "Iniciar" encontrados:', btnCount)
    if (btnCount === 0) logBug('03b', 'No hay botón "Iniciar Sesión de Consejo" — documentos en pendiente pero botón no aparece')

    expect(!hasCrash && btnCount > 0).toBeTruthy()
  })

  test('SMK-04: Sesión de Consejo — Iniciar y primera pregunta', async ({ page }) => {
    test.setTimeout(60000)

    await login(page)
    await page.goto(`${BASE}/project/${SMOKE_PROJECT_ID}/sesion-consejo`)
    await page.waitForLoadState('networkidle')

    const iniciarBtn = page.locator('button').filter({ hasText: /Iniciar/i }).first()
    const btnVisible = await iniciarBtn.isVisible()
    if (!btnVisible) {
      logBug('04a', 'No se puede iniciar sesión — botón Iniciar no visible. ¿Documentos ya en_progreso?')
      await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04-no-iniciar.png' })
      console.log('SKIP: Skipping since no start button')
      return
    }

    await iniciarBtn.click()
    console.log('Sesión iniciada — esperando pregunta (~5s)...')
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04-first-question.png' })

    const bodyText = await page.textContent('body') ?? ''
    const hasQuestion = bodyText.includes('Pregunta') || bodyText.includes('pregunta') || bodyText.includes('?')
    const hasInput = (await page.locator('textarea').count()) > 0
    console.log('Pregunta visible:', hasQuestion, '| Input visible:', hasInput)

    if (!hasQuestion) logBug('04b', 'No aparece ninguna pregunta tras iniciar sesión')
    if (!hasInput) logBug('04c', 'No aparece textarea para responder tras iniciar sesión')

    if (hasInput) {
      // Answer the question
      const textarea = page.locator('textarea').first()
      await textarea.fill('El mercado objetivo son PyMEs en México con 10-50 empleados. El TAM estimado es de $2B USD. Los competidores principales son SAP y Aspel.')

      const sendBtn = page.locator('button').filter({ hasText: /Enviar|Submit/i }).last()
      const sendVisible = await sendBtn.isVisible()
      console.log('Botón Enviar visible:', sendVisible)
      if (!sendVisible) logBug('04d', 'Botón Enviar no visible tras escribir respuesta')

      if (sendVisible) {
        await sendBtn.click()
        console.log('Respuesta enviada — esperando Nexo Dual (~30s)...')
        await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04-submitted.png' })

        // Wait for Nexo Dual response
        try {
          await page.waitForFunction(
            () => {
              const text = document.body.textContent?.toLowerCase() ?? ''
              return text.includes('constructiv') || text.includes('críti') || text.includes('debate') || text.includes('acuerdo') || text.includes('propuesta')
            },
            { timeout: 60000 }
          )
          await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04-nexo-dual.png' })
          console.log('✓ Nexo Dual respondió')

          // Check for resolve buttons
          const resolveBtns = page.locator('button').filter({ hasText: /constructiva|crítica|Acuerdo|Responder yo/i })
          const rCount = await resolveBtns.count()
          console.log('Botones de resolución:', rCount)
          if (rCount === 0) logBug('04e', 'Nexo Dual respondió pero no hay botones de resolución (constructiva/crítica/acuerdo)')

          // Try to resolve
          if (rCount > 0) {
            await resolveBtns.first().click()
            console.log('Resolución elegida — esperando siguiente estado...')
            await page.waitForTimeout(8000)
            await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04-after-resolve.png' })

            const afterBody = await page.textContent('body') ?? ''
            const sessionComplete = afterBody.includes('completada') || afterBody.includes('completa') || afterBody.includes('Sesión')
            const nextQuestion = afterBody.includes('Pregunta') || (await page.locator('textarea').count()) > 0
            console.log('Session complete:', sessionComplete, '| Next question:', nextQuestion)
          }
        } catch (e) {
          logBug('04f', `Nexo Dual no respondió en 60s: ${(e as Error).message}`)
          await page.screenshot({ path: 'tests/e2e/screenshots/smoke-04-timeout.png' })
        }
      }
    }
  })

  test('SMK-05: Export Center — carga y documentos', async ({ page }) => {
    await login(page)

    // Use FinTrack which has approved documents with content_json
    const fintrackId = 'e83780c8-f454-4d67-b5b4-df5a746633ed'
    await page.goto(`${BASE}/project/${fintrackId}/export`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-05-export.png' })

    await page.waitForTimeout(2000)
    const bodyText = await page.textContent('body') ?? ''
    const hasCrash = bodyText.includes('Internal Server Error') ||
      (bodyText.includes('Application error') && !bodyText.includes('Export'))
    if (hasCrash) logBug('05a', 'Export Center lanza error fatal')

    const hasExport = bodyText.includes('Export') || bodyText.includes('export')
    if (!hasExport) logBug('05b', 'Export Center no cargó')

    // Check for PDF buttons
    const pdfBtns = page.locator('button').filter({ hasText: /PDF/i })
    const pdfCount = await pdfBtns.count()
    console.log('Botones PDF:', pdfCount)
    if (pdfCount === 0) logBug('05c', 'No hay botones de descarga PDF en Export Center')

    // Check for PPTX buttons (Story 5.3)
    const pptxBtns = page.locator('button').filter({ hasText: /PPTX|PowerPoint/i })
    const pptxCount = await pptxBtns.count()
    console.log('Botones PPTX:', pptxCount)
    if (pptxCount === 0) logBug('05d', 'No hay botones PPTX en Export Center — Story 5.3 no desplegado')

    // Verify PDF API call via route interception
    if (pdfCount > 0 && await pdfBtns.first().isEnabled()) {
      let pdfApiCalled = false
      page.on('request', req => { if (req.url().includes('/api/export/pdf')) pdfApiCalled = true })
      await pdfBtns.first().click()
      await page.waitForTimeout(3000)
      console.log('PDF API llamado:', pdfApiCalled)
      if (!pdfApiCalled) logBug('05e', 'Botón PDF no llamó a /api/export/pdf')
      else console.log('✓ PDF: /api/export/pdf llamado correctamente')
    }

    // Verify PPTX API call — find a per-document PPTX button (not the bulk "Descargar todo")
    const pptxRowBtns = page.locator('button').filter({ hasText: /^PPTX$/i })
    const pptxRowCount = await pptxRowBtns.count()
    console.log('Botones PPTX por fila:', pptxRowCount)
    if (pptxRowCount > 0 && await pptxRowBtns.first().isEnabled()) {
      let pptxApiCalled = false
      page.on('request', req => { if (req.url().includes('/api/export/pptx')) pptxApiCalled = true })
      await pptxRowBtns.first().click()
      await page.waitForTimeout(5000)
      console.log('PPTX API llamado:', pptxApiCalled)
      if (!pptxApiCalled) logBug('05h', 'Botón PPTX por fila no llamó a /api/export/pptx')
      else console.log('✓ PPTX: /api/export/pptx llamado correctamente')
    } else {
      console.log('INFO: No hay botones PPTX individuales habilitados (verificar ExportCenter layout)')
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-05-export-final.png' })
  })

  test('SMK-06: Settings Billing carga', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/settings/facturacion`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-06-billing.png' })

    const bodyText = await page.textContent('body') ?? ''
    const hasCrash = bodyText.includes('Internal Server Error') ||
      (bodyText.includes('Application error') && !bodyText.includes('Saldo'))
    if (hasCrash) logBug('06a', 'Settings Billing lanza error fatal')

    const hasBilling = bodyText.includes('Saldo') || bodyText.includes('facturación') || bodyText.includes('Plan')
    if (!hasBilling) logBug('06b', 'Settings Billing no cargó el componente SettingsBilling')
    console.log('Billing cargó:', hasBilling)
    expect(hasBilling).toBeTruthy()
  })

  test('SMK-07: Settings Plans carga', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/settings/planes`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-07-planes.png' })

    const bodyText = await page.textContent('body') ?? ''
    const hasCrash = bodyText.includes('Internal Server Error') ||
      (bodyText.includes('Application error') && !bodyText.includes('Plan'))
    if (hasCrash) logBug('07a', 'Settings Plans lanza error fatal')

    const hasPlans = bodyText.includes('Plan') || bodyText.includes('Core') || bodyText.includes('Pro')
    if (!hasPlans) logBug('07b', 'Settings Plans no cargó los planes')
    console.log('Plans cargó:', hasPlans)
    expect(hasPlans).toBeTruthy()
  })

  test('SMK-REPORT: Resumen de bugs encontrados', async () => {
    console.log('\n════════════════════════════════════════')
    console.log('REPORTE SMOKE TEST — Story 5.4')
    console.log('════════════════════════════════════════')
    if (BUGS.length === 0) {
      console.log('✅ Sin bugs detectados en este run')
    } else {
      console.log(`🐛 ${BUGS.length} bug(s) encontrado(s):`)
      BUGS.forEach((b, i) => console.log(`  ${i+1}. ${b}`))
    }
    console.log('════════════════════════════════════════\n')
    // This test always passes — it's just a report
    expect(true).toBeTruthy()
  })
})
