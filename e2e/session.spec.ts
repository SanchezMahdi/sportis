import { test, expect, request } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SUPABASE_URL = 'https://zrxcagcwhffqawctepep.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeGNhZ2N3aGZmcWF3Y3RlcGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDY1OTEsImV4cCI6MjA5MjcyMjU5MX0.-mJbIbYF8oEFULUoIhHrf3LetUE5LOBQH9q6dICwYoE'

test.use({ storageState: path.join(__dirname, '.auth/user.json') })

// Alle Session-Tests laufen sequentiell und teilen die erstellte Session-ID
test.describe.serial('Session Flows', () => {
  let sessionId: string

  // ── 1. Session erstellen ────────────────────────────────────────────────
  test('Session erstellen — kein Fehler-Toast, Weiterleitung zur Detail-Seite', async ({ page }) => {
    await page.goto('/session/erstellen')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder(/titel|z\.b\. fußball/i).fill('E2E Test Session')
    await page.getByRole('button', { name: /fußball/i }).first().click()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0])
    await page.locator('input[type="time"]').fill('18:00')
    await page.getByPlaceholder(/ort|reinbek|stadtpark/i).fill('Testplatz Hamburg')

    // Kein Fehler-Toast darf erscheinen
    const errorToast = page.getByText(/konnte nicht erstellt werden/i)

    await page.getByRole('button', { name: /session erstellen/i }).click()

    // Erfolgreich → Weiterleitung auf /session/<uuid>
    await expect(page).toHaveURL(/\/session\/[0-9a-f-]{36}/, { timeout: 15000 })
    await expect(errorToast).not.toBeVisible()

    sessionId = page.url().split('/session/')[1]
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/)
  })

  // ── 2. DB-Schema-Validierung ────────────────────────────────────────────
  test('DB-Validierung — alle NOT NULL Pflichtfelder korrekt gesetzt', async () => {
    expect(sessionId, 'Session-ID muss aus Test 1 vorliegen').toBeTruthy()

    const api = await request.newContext()
    const res = await api.get(
      `${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}&select=id,host_id,creator_id,title,sport,skill_level,location,location_name,scheduled_at,date,time,max_players`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    )

    expect(res.ok()).toBeTruthy()
    const [session] = await res.json()

    // Pflichtfelder die früher fehlten und den Bug verursachten
    expect(session.host_id, 'host_id muss gesetzt sein (NOT NULL)').toBeTruthy()
    expect(session.creator_id, 'creator_id muss gesetzt sein').toBeTruthy()
    expect(session.host_id).toBe(session.creator_id)
    expect(session.location_name, 'location_name muss gesetzt sein (NOT NULL)').toBeTruthy()
    expect(session.scheduled_at, 'scheduled_at muss gesetzt sein (NOT NULL)').toBeTruthy()

    // Inhalts-Validierung
    expect(session.title).toBe('E2E Test Session')
    expect(session.sport).toBe('football')
    expect(session.location).toBe('Testplatz Hamburg')
    expect(session.location_name).toBe('Testplatz Hamburg')
    expect(session.max_players).toBe(10)

    // scheduled_at muss ein gültiges Datum sein
    const scheduledDate = new Date(session.scheduled_at)
    expect(scheduledDate.getTime()).not.toBeNaN()

    await api.dispose()
  })

  // ── 3. Session bearbeiten ───────────────────────────────────────────────
  test('Session bearbeiten — Speichern funktioniert (Enum-Cast-Bug behoben)', async ({ page }) => {
    await page.goto(`/session/${sessionId}`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /bearbeiten/i }).click()
    await page.locator('textarea').fill('Automatisch bearbeitet via E2E')
    await page.getByRole('button', { name: /^speichern$/i }).click()

    await expect(page.getByText(/erfolgreich aktualisiert/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/konnte nicht gespeichert/i)).not.toBeVisible()
  })

  // ── 4. Session-Detail korrekt angezeigt ────────────────────────────────
  test('Session-Detail — Inhalte sichtbar', async ({ page }) => {
    await page.goto(`/session/${sessionId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('E2E Test Session')).toBeVisible()
    await expect(page.getByText(/fußball/i)).toBeVisible()
    await expect(page.getByText(/18:00/)).toBeVisible()
    await expect(page.getByText(/Testplatz Hamburg/i)).toBeVisible()
  })

  // ── 5. Chat ─────────────────────────────────────────────────────────────
  test('Session-Chat — Nachricht senden funktioniert', async ({ page }) => {
    await page.goto(`/session/${sessionId}`)
    await page.waitForLoadState('networkidle')

    const chatMessage = `E2E Chat ${Date.now()}`
    const chatInput = page.getByPlaceholder(/nachricht schreiben/i)
    const sendButton = page.getByRole('button', { name: /senden/i })
    await chatInput.fill(chatMessage)
    await expect(sendButton).toBeEnabled()
    await sendButton.click()

    await expect(chatInput).toHaveValue('', { timeout: 10000 })
    await expect(page.getByText(chatMessage)).toBeVisible()
    await expect(page.getByText(/nachricht konnte nicht gesendet werden/i)).not.toBeVisible()

    await page.reload()
    await page.waitForLoadState('load')
    await expect(page.locator('body')).toContainText(chatMessage)
  })

  // ── 6. Entdecken-Seite ──────────────────────────────────────────────────
  test('Entdecken — Seite lädt ohne Fehler', async ({ page }) => {
    await page.goto('/entdecken')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  // ── 7. Teilnehmer entfernen (Creator-Berechtigung) ──────────────────────
  test('Teilnehmer entfernen — Creator kann Teilnehmer kicken', async ({ page, request }) => {
    expect(sessionId).toBeTruthy()

    // Zweiten User als Teilnehmer hinzufügen (direkt via API mit anderem Token)
    const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_SERVICE) {
      test.skip(true, 'SUPABASE_SERVICE_ROLE_KEY nicht gesetzt — Test übersprungen')
      return
    }

    // Zweiten Test-User direkt in session_participants eintragen
    const secondUserId = process.env.E2E_SECOND_USER_ID
    if (!secondUserId) {
      test.skip(true, 'E2E_SECOND_USER_ID nicht gesetzt — Test übersprungen')
      return
    }

    const insert = await request.post(
      `${SUPABASE_URL}/rest/v1/session_participants`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_SERVICE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        data: { session_id: sessionId, user_id: secondUserId },
      }
    )
    expect(insert.ok()).toBeTruthy()

    // Als Creator die Session aufrufen und Teilnehmer entfernen
    await page.goto(`/session/${sessionId}`)
    await page.waitForLoadState('networkidle')

    const removeBtn = page.locator('[title="Entfernen"]').first()
    await expect(removeBtn).toBeVisible({ timeout: 5000 })

    page.on('dialog', (d) => d.accept())
    await removeBtn.click()

    await expect(page.getByText(/wurde entfernt/i)).toBeVisible({ timeout: 8000 })
    await expect(removeBtn).not.toBeVisible()
  })

  // ── 8. Aufräumen ────────────────────────────────────────────────────────
  test('Aufräumen — Test-Session löschen', async ({ page }) => {
    await page.goto(`/session/${sessionId}`)
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.getByRole('button', { name: /löschen/i })
    if (await deleteBtn.isVisible()) {
      page.on('dialog', (d) => d.accept())
      await deleteBtn.click()
      await expect(page).toHaveURL(/\/entdecken/, { timeout: 10000 })
    }
  })
})
