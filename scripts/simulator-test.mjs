import { chromium, devices } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotsDir = path.resolve(__dirname, '../screenshots-simulator')
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

const BASE_URL = 'http://localhost:5173'

async function runSimulatorTests() {
  console.log('Starte Playwright Simulator Tests...')
  const browser = await chromium.launch({ headless: true })
  
  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    details: []
  }

  function record(title, pass, info = '') {
    results.totalTests++
    if (pass) {
      results.passed++
      console.log(`[PASS] ${title}${info ? ' - ' + info : ''}`)
    } else {
      results.failed++
      console.error(`[FAIL] ${title}${info ? ' - ' + info : ''}`)
    }
    results.details.push({ title, pass, info })
  }

  try {
    // ----------------------------------------------------
    // Context 1: Mobile iPhone 14 Device Simulation (Viewport 393 x 852)
    // ----------------------------------------------------
    const iphoneContext = await browser.newContext({
      ...devices['iPhone 14'],
      baseURL: BASE_URL,
    })

    // Auth Pre-Seed in localStorage
    await iphoneContext.addInitScript(() => {
      localStorage.setItem('sportis_dev_user', JSON.stringify({
        id: 'ed38922d-61de-4b49-932d-ef8a1e919002',
        email: 'farisdababneh18@gmail.com',
        user_metadata: { name: 'Test Sportler' }
      }))
    })

    const mobilePage = await iphoneContext.newPage()

    // Test 1: Navigation zu /sessions auf Mobile
    console.log('\n--- 1. Test: Mobile Viewport /sessions ---')
    await mobilePage.goto(`${BASE_URL}/sessions`)
    await mobilePage.waitForLoadState('networkidle')
    await mobilePage.waitForTimeout(1000)

    const sessionCards = await mobilePage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-\\[24px\\], .rounded-\\[28px\\], .rounded-\\[32px\\], [class*="card"]'))
      return cards.map(c => {
        const text = c.textContent || ''
        const img = c.querySelector('img')
        return {
          text: text.slice(0, 100),
          imgSrc: img ? img.getAttribute('src') : null,
          imgAlt: img ? img.getAttribute('alt') : null
        }
      }).filter(c => c.imgSrc)
    })

    console.log(`Gefundene Session-Karten auf Mobile /sessions: ${sessionCards.length}`)
    record('Session-Karten werden mobil angezeigt', sessionCards.length > 0, `${sessionCards.length} Karten`)

    // Prüfe alle Karten: Kein Spaziergang darf ein Fußballbild haben
    sessionCards.forEach(c => {
      const isWalking = c.text.toLowerCase().includes('spazier') || c.text.toLowerCase().includes('walk')
      if (isWalking) {
        const hasSoccer = c.imgSrc?.includes('sports_soccer.png')
        record('Spazieren hat kein Fussballbild', !hasSoccer, `Bild: ${c.imgSrc}`)
      }
    })

    const ss1Path = path.join(screenshotsDir, '01_mobile_sessions_list.png')
    await mobilePage.screenshot({ path: ss1Path, fullPage: false })
    console.log(`Screenshot gespeichert: ${ss1Path}`)

    // Test 2: Assets Availability Check (HTTP 200 für alle Sport-Illustrationen)
    console.log('\n--- 2. Test: Sport-Illustrationen HTTP 200 Check ---')
    const sportsToCheck = [
      '/figma/sports_walking.png',
      '/figma/sports_running.png',
      '/figma/sports_cycling.png',
      '/figma/sports_tennis.png',
      '/figma/sports_tabletennis.png',
      '/figma/sports_volleyball.png',
      '/figma/sports_fitness.png',
      '/figma/sports_yoga.png',
      '/figma/sports_general.png',
      '/figma/sports_chillen.png',
      '/figma/sports_soccer.png'
    ]

    for (const asset of sportsToCheck) {
      const resp = await mobilePage.request.get(`${BASE_URL}${asset}`)
      record(`Asset lädt erfolgreich (HTTP 200): ${asset}`, resp.status() === 200, `Status ${resp.status()}`)
    }

    // Test 3: Session Erstellen auf Mobile (/session/erstellen)
    console.log('\n--- 3. Test: Mobile /session/erstellen ---')
    await mobilePage.goto(`${BASE_URL}/session/erstellen`)
    await mobilePage.waitForLoadState('networkidle')
    await mobilePage.waitForTimeout(800)

    // Prüfe Quick-Select-Chips auf "Spazieren"
    const spazierenChip = mobilePage.locator('button').filter({ hasText: /^Spazieren$/i })
    const chipExists = (await spazierenChip.count()) > 0
    record('Spazieren Quick-Select-Chip vorhanden', chipExists)

    if (chipExists) {
      await spazierenChip.first().click()
      await mobilePage.waitForTimeout(300)

      // Titel eingeben
      const titleInput = mobilePage.locator('input[type="text"]').first()
      await titleInput.fill('Alster-Spaziergang am Nachmittag')
      record('Titel für Spazieren eingetragen', true)

      // Datum & Uhrzeit & Ort
      const dateInput = mobilePage.locator('input[type="date"]').first()
      if (await dateInput.count() > 0) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 2)
        await dateInput.fill(tomorrow.toISOString().split('T')[0])
      }
      const timeInput = mobilePage.locator('input[type="time"]').first()
      if (await timeInput.count() > 0) {
        await timeInput.fill('16:00')
      }
      const locationInput = mobilePage.getByPlaceholder(/Ort|Reinbek|Stadtpark|Hafencity/i).first()
      if (await locationInput.count() > 0) {
        await locationInput.fill('Alster Hamburg')
      }

      // Prüfe, dass keine Emojis in den Formular-Chips oder Buttons gerendert werden
      const emojiCheck = await mobilePage.evaluate(() => {
        const container = document.querySelector('form')
        if (!container) return false
        const text = container.textContent || ''
        const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u
        return emojiRegex.test(text)
      })
      record('Formular enthält absolut keine Emojis', !emojiCheck)

      const ss2Path = path.join(screenshotsDir, '02_mobile_create_session.png')
      await mobilePage.screenshot({ path: ss2Path, fullPage: false })
      console.log(`Screenshot gespeichert: ${ss2Path}`)

      // Session ohne Bild hochladen absenden
      console.log('Sende Spazieren-Session ohne Bild ab...')
      const submitBtn = mobilePage.locator('button[type="submit"]').first()
      await submitBtn.click()
      await mobilePage.waitForTimeout(3000)
    }

    // Prüfe nun die Session-Liste: Die neu erstellte Spaziergang-Session muss sports_walking.png haben
    await mobilePage.goto(`${BASE_URL}/sessions`)
    await mobilePage.waitForLoadState('networkidle')
    await mobilePage.waitForTimeout(1000)

    const walkingCardImages = await mobilePage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-\\[24px\\], .rounded-\\[28px\\], .rounded-\\[32px\\], [class*="card"]'))
      return cards
        .filter(c => (c.textContent || '').toLowerCase().includes('spazier'))
        .map(c => {
          const img = c.querySelector('img')
          return {
            title: c.textContent?.slice(0, 60),
            src: img ? img.getAttribute('src') : null
          }
        })
    })

    console.log('Spazieren-Karten auf /sessions nach Erstellung:', walkingCardImages)
    if (walkingCardImages.length > 0) {
      const soccerFound = walkingCardImages.some(w => w.src && w.src.includes('sports_soccer.png'))
      record('Keine Spazieren-Karte verwendet Fussballbild (sports_soccer.png)', !soccerFound)
      const walkingOrCustomFound = walkingCardImages.some(w => w.src && (w.src.includes('sports_walking.png') || w.src.includes('supabase')))
      record('Spazieren-Karten nutzen korrekte Illustration sports_walking.png oder eigenes Foto', walkingOrCustomFound)
    }

    await iphoneContext.close()

    // ----------------------------------------------------
    // Context 2: iPhone Simulator Frame View (/app)
    // ----------------------------------------------------
    console.log('\n--- 4. Test: iPhone Simulator Frame View (/app) ---')
    const simContext = await browser.newContext({
      viewport: { width: 1200, height: 950 },
      deviceScaleFactor: 2,
    })

    // Auth Pre-Seed in localStorage
    await simContext.addInitScript(() => {
      localStorage.setItem('sportis_dev_user', JSON.stringify({
        id: 'ed38922d-61de-4b49-932d-ef8a1e919002',
        email: 'farisdababneh18@gmail.com',
        user_metadata: { name: 'Test Sportler' }
      }))
    })

    const simPage = await simContext.newPage()

    await simPage.goto(`${BASE_URL}/app`)
    await simPage.waitForLoadState('networkidle')
    await simPage.waitForTimeout(1200)

    // Prüfe iPhone Frame
    const hasFrame = (await simPage.locator('.bg-\\[\\#FDFDFE\\], .min-h-\\[880px\\]').count()) > 0
    record('iPhone Simulator Frame gerendert', hasFrame)

    const ss3Path = path.join(screenshotsDir, '03_iphone_simulator_feed.png')
    await simPage.screenshot({ path: ss3Path, fullPage: false })
    console.log(`Screenshot gespeichert: ${ss3Path}`)

    // Test 5: iPhone Create Session (/app/create)
    console.log('\n--- 5. Test: iPhone Create Session Maske (/app/create) ---')
    await simPage.goto(`${BASE_URL}/app/create`)
    await simPage.waitForLoadState('networkidle')
    await simPage.waitForTimeout(1000)

    // Prüfe Sportarten-Pills in der iPhone Maske
    const iphoneChips = await simPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      return buttons.map(b => b.textContent?.trim()).filter(t => t && ['Spazieren', 'Laufen', 'Fußball', 'Basketball', 'Fitness', 'Yoga', 'Radfahren'].includes(t))
    })
    console.log('Gefundene Sport-Optionen im iPhone Simulator:', iphoneChips)
    record('Spazieren ist in iPhone Sportarten-Auswahl enthalten', iphoneChips.includes('Spazieren'))

    // Event-Name eingeben: "Spaziergang an der Elbe"
    const eventNameInput = simPage.locator('input[type="text"]').first()
    if (await eventNameInput.count() > 0) {
      await eventNameInput.fill('Spaziergang an der Elbe')
      await simPage.waitForTimeout(500)

      // Prüfe, ob "Spazieren" aktiv selektiert ist
      const isSpazierenSelected = await simPage.evaluate(() => {
        // Find Spazieren button and check if it has the active styling
        const buttons = Array.from(document.querySelectorAll('button'))
        const spBtn = buttons.find(b => b.textContent?.trim() === 'Spazieren')
        if (!spBtn) return false
        return spBtn.className.includes('bg-[#5B3FE9]') || spBtn.className.includes('text-white')
      })
      console.log('Ist Spazieren durch Auto-Erkennung selektiert:', isSpazierenSelected)
      record('Auto-Erkennung wählt Spazieren bei "Spaziergang"', isSpazierenSelected)
    }

    // Prüfe auch, dass keine Emojis in der iPhone Maske vorkommen
    const iphoneEmojiCheck = await simPage.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return false
      const text = main.textContent || ''
      const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u
      return emojiRegex.test(text)
    })
    record('iPhone Maske enthält absolut keine Emojis', !iphoneEmojiCheck)

    const ss4Path = path.join(screenshotsDir, '04_iphone_simulator_create.png')
    await simPage.screenshot({ path: ss4Path, fullPage: false })
    console.log(`Screenshot gespeichert: ${ss4Path}`)

    await simContext.close()

  } catch (error) {
    console.error('Fehler während des Simulator-Tests:', error)
    record('Simulator-Test Ausführung ohne Absturz', false, error.message)
  } finally {
    await browser.close()
  }

  console.log('\n======================================')
  console.log(`Testergebnis: ${results.passed} bestanden, ${results.failed} fehlgeschlagen von ${results.totalTests}`)
  console.log('======================================')

  return results
}

runSimulatorTests().then(res => {
  if (res.failed > 0) process.exit(1)
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
