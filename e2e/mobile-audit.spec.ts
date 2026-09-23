import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 14
  deviceScaleFactor: 2,
  baseURL: 'http://localhost:4173',
})

async function login(page: any) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByPlaceholder('name@beispiel.de').first().fill('e2e-test@sportis.app')
  await page.getByPlaceholder('Dein Passwort').fill('E2eTestPass123!')
  await page.locator('button[type="submit"]').filter({ hasText: 'Anmelden' }).click()
  await page.waitForURL('**/entdecken', { timeout: 15000 })
}

const publicPages = [
  { name: 'landing', url: '/' },
  { name: 'entdecken', url: '/entdecken' },
  { name: 'session-detail', url: '/session/29ea30fa-10ea-49c3-9745-d8bcc118d5e2' },
  { name: 'plaetze', url: '/plaetze' },
]

const authPages = [
  { name: 'session-erstellen', url: '/session/erstellen' },
  { name: 'dashboard', url: '/dashboard' },
  { name: 'profil', url: '/profil' },
]

for (const p of publicPages) {
  test(`mobile: ${p.name}`, async ({ page }) => {
    await page.goto(p.url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `e2e/screenshots/${p.name}.png`, fullPage: true })
  })
}

test('mobile: auth pages', async ({ page }) => {
  await login(page)
  for (const p of authPages) {
    await page.goto(p.url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `e2e/screenshots/${p.name}.png`, fullPage: true })
  }
})
