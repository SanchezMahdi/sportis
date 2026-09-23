import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.getByPlaceholder('name@beispiel.de').first().fill('e2e-test@sportis.app')
  await page.getByPlaceholder('Dein Passwort').fill('E2eTestPass123!')
  await page.locator('button[type="submit"]').filter({ hasText: 'Anmelden' }).click()

  await expect(page).toHaveURL(/\/entdecken/, { timeout: 15000 })

  await page.context().storageState({ path: authFile })
})
