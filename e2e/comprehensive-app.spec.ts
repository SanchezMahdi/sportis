import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

test.describe('End-to-End Testsuite: Sportis Full Functionality Audit', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. LANDING PAGE & FIGMA DESIGN VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  test('1. Landing Page: Hero, Campus League, About Us, Picture Gallery, Footer', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })

    // Verify Title & Top Navbar
    await expect(page).toHaveTitle(/sportis/i)
    const navbar = page.locator('header')
    await expect(navbar).toBeVisible()
    await expect(navbar.getByText('Sportis')).toBeVisible()
    await expect(navbar.getByRole('link', { name: 'About us' })).toBeVisible()
    await expect(navbar.getByRole('link', { name: 'Pictures' })).toBeVisible()
    await expect(navbar.getByRole('link', { name: 'Session', exact: true })).toBeVisible()
    await expect(navbar.getByRole('link', { name: 'How it Works' })).toBeVisible()
    await expect(navbar.getByRole('link', { name: /log in/i })).toBeVisible()

    // 1. Hero Banner: Exact Figma Banner must be loaded and visible
    const heroImg = page.locator('img[src="/figma/hero_banner_exact.png"]')
    await expect(heroImg).toBeVisible()

    // 2. Campus League Section: Übertitel, 6 Roadmap Steps, 5 Photos, Trophy
    const campusLeagueSection = page.locator('#campus-league')
    await expect(campusLeagueSection).toBeVisible()
    await expect(campusLeagueSection.locator('h2').filter({ hasText: 'Campus League' })).toBeVisible()

    // Verify all 6 steps
    await expect(campusLeagueSection.getByText('Meet new people').first()).toBeVisible()
    await expect(campusLeagueSection.getByText('Join different sessions').first()).toBeVisible()
    await expect(campusLeagueSection.getByText('Build your team').first()).toBeVisible()
    await expect(campusLeagueSection.getByText('Play & connect').first()).toBeVisible()
    await expect(campusLeagueSection.getByText('Tournaments & events').first()).toBeVisible()
    await expect(campusLeagueSection.getByText('The Final Cup & Summer BBQ').first()).toBeVisible()

    // Verify Trophy & Photos
    await expect(page.locator('img[src="/figma/trophy.png"]')).toBeVisible()
    const roadmapPhotos = page.locator('#campus-league img[src*="photo_"]')
    expect(await roadmapPhotos.count()).toBeGreaterThanOrEqual(5)

    // 3. About Us Section: Übertitel, Video Card & Video Modal Flow
    const aboutUsSection = page.locator('#about-us')
    await expect(aboutUsSection).toBeVisible()
    await expect(aboutUsSection.locator('h2').filter({ hasText: 'About us' })).toBeVisible()
    await expect(page.getByText('Sport brings people together').first()).toBeVisible()
    await expect(page.getByText('More than just a game').first()).toBeVisible()

    // Click Video Preview Card to open video modal
    const videoPreviewCard = page.locator('img[alt="Sportis Video Preview"]').locator('..')
    await videoPreviewCard.click()
    const videoModal = page.locator('video')
    await expect(videoModal).toBeVisible({ timeout: 5000 })

    // Close Video Modal by clicking the close button inside the modal dialog
    const closeBtn = page.locator('.fixed.inset-0 button:has(svg.lucide-x)')
    await closeBtn.click()
    await expect(videoModal).not.toBeVisible()

    // 4. Picture Section: Übertitel, Community Title, Interactive Arched Gallery
    const pictureSection = page.locator('#pictures')
    await expect(pictureSection).toBeVisible()
    await expect(pictureSection.locator('h2').filter({ hasText: 'Picture' })).toBeVisible()
    await expect(page.getByText('Meet the Community').first()).toBeVisible()
    await expect(page.getByText('More than just teammates').first()).toBeVisible()

    // Gallery navigation buttons
    const prevBtn = page.locator('#pictures button').first()
    const nextBtn = page.locator('#pictures button').last()
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()

    // Test clicking navigation buttons
    await nextBtn.click()
    await page.waitForTimeout(300)
    await nextBtn.click()
    await page.waitForTimeout(300)
    await prevBtn.click()
    await page.waitForTimeout(300)

    // 5. Footer: Branding & Links
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText('Meet. Play. Connect.')).toBeVisible()
    await expect(footer.getByText(/All rights reserved/i)).toBeVisible()

    // Ensure zero critical JS runtime crashes
    expect(pageErrors).toEqual([])
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SESSIONS PAGE & FILTERING
  // ──────────────────────────────────────────────────────────────────────────
  test('2. Sessions Page: Search, Category Filters, Cards, and Create Link', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(`${BASE_URL}/sessions`, { waitUntil: 'networkidle' })

    // Heading Banner
    const bannerImg = page.locator('img[alt="Find Your Community by joing Session"]')
    await expect(bannerImg).toBeVisible()

    // "Session erstellen" Button
    const createBtn = page.getByRole('link', { name: /Session erstellen/i })
    await expect(createBtn).toBeVisible()

    // Category Cards (Soccer, Basketball, Skating, Bar)
    await expect(page.getByText('Soccer').first()).toBeVisible()
    await expect(page.getByText('Basketball').first()).toBeVisible()
    await expect(page.getByText('Skating').first()).toBeVisible()

    // Search bar inputs
    const locationInput = page.getByPlaceholder(/location/i)
    if (await locationInput.isVisible()) {
      await locationInput.fill('Hamburg')
      expect(await locationInput.inputValue()).toBe('Hamburg')
    }

    expect(pageErrors).toEqual([])
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SESSION ERSTELLEN FORM VALIDATION & INTERACTIVITY
  // ──────────────────────────────────────────────────────────────────────────
  test('3. Session Erstellen: Form Fields, Sport Selection, and Interactions', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(`${BASE_URL}/session/erstellen`, { waitUntil: 'networkidle' })

    // Check headings and form elements from Figma
    await expect(page.getByText('Level').first()).toBeVisible()
    await expect(page.getByText('Titel').first()).toBeVisible()
    await expect(page.getByText('Ort').first()).toBeVisible()

    // Form inputs: Title input
    const titleInput = page.locator('input[placeholder="Type here"]')
    await expect(titleInput).toBeVisible()
    await titleInput.fill('Figma E2E Test Match')
    expect(await titleInput.inputValue()).toBe('Figma E2E Test Match')

    // Submit button "Erstellen"
    const submitBtn = page.locator('button:has-text("Erstellen")')
    await expect(submitBtn).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. LOGIN & AUTHENTICATION PAGE
  // ──────────────────────────────────────────────────────────────────────────
  test('4. Login Page: Mode Switching, Visual Artwork, Form Inputs', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Verify 2-Column Split: Right side sports illustration cluster
    const clusterImg = page.locator('img[src*="login_sports_cluster"]')
    await expect(clusterImg).toBeVisible()

    // Check Initial Mode: Sign up or Login
    const formHeading = page.locator('h1')
    await expect(formHeading).toBeVisible()

    // Mode Toggle button: e.g. "Login now" or "Sign up now"
    const toggleModeBtn = page.getByRole('button', { name: /login now|sign up now/i }).first()
    if (await toggleModeBtn.isVisible()) {
      const initialText = await formHeading.innerText()
      await toggleModeBtn.click()
      await page.waitForTimeout(300)
      const switchedText = await formHeading.innerText()
      expect(initialText).not.toBe(switchedText)
    }

    // Input fields test: Email & Password
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"], input[placeholder="Password"]')
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    await emailInput.fill('test-user@campus.de')
    await passwordInput.fill('Secret1234!')

    expect(await emailInput.inputValue()).toBe('test-user@campus.de')

    // Social Login Buttons: Google, Apple, Microsoft
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Apple/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Microsoft/i })).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. EVENTS & TOURNAMENTS PAGE
  // ──────────────────────────────────────────────────────────────────────────
  test('5. Events Page: Tournaments & Events List', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle' })

    // Events heading
    await expect(page.getByText(/Events|Turniere/i).first()).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. MOBILE RESPONSIVENESS (iPhone 14 Viewport 390x844)
  // ──────────────────────────────────────────────────────────────────────────
  test('6. Mobile Responsiveness: Navbar, Hero, Roadmap, Gallery on Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })

    // Mobile Hamburger button
    const mobileMenuBtn = page.locator('header button').first()
    await expect(mobileMenuBtn).toBeVisible()

    // Click mobile menu
    await mobileMenuBtn.click()
    await page.waitForTimeout(300)
    await expect(page.locator('.md\\:hidden a:has-text("About us")')).toBeVisible()
    await expect(page.locator('.md\\:hidden a:has-text("Sessions")')).toBeVisible()

    // Close menu
    await mobileMenuBtn.click()
    await page.waitForTimeout(300)

    // Hero image is visible on mobile
    const heroImg = page.locator('img[src="/figma/hero_banner_exact.png"]')
    await expect(heroImg).toBeVisible()

    // Campus League section on mobile
    await expect(page.getByText('Campus League')).toBeVisible()
    await expect(page.locator('#campus-league .lg\\:hidden').getByText('Meet new people').first()).toBeVisible()

    // Picture gallery on mobile
    await expect(page.getByText('Meet the Community')).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. LEGAL & STATIC PAGES
  // ──────────────────────────────────────────────────────────────────────────
  test('7. Legal Pages: Impressum and Datenschutz', async ({ page }) => {
    await page.goto(`${BASE_URL}/impressum`, { waitUntil: 'networkidle' })
    await expect(page.getByText(/Impressum/i).first()).toBeVisible()

    await page.goto(`${BASE_URL}/datenschutz`, { waitUntil: 'networkidle' })
    await expect(page.getByText(/Datenschutz/i).first()).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 8. GLOBAL COMPONENTS: COOKIE BANNER & FEEDBACK WIDGET
  // ──────────────────────────────────────────────────────────────────────────
  test('8. Global Components: Cookie Banner Consent & Feedback Widget', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })

    // Cookie Banner is displayed
    const cookieBanner = page.getByText(/Cookies & Datenschutz/i)
    if (await cookieBanner.isVisible()) {
      const acceptBtn = page.getByRole('button', { name: /Akzeptieren/i })
      await acceptBtn.click()
      await expect(cookieBanner).not.toBeVisible()
    }

    // Feedback Widget button
    const feedbackBtn = page.getByRole('button', { name: /Feedback/i })
    await expect(feedbackBtn).toBeVisible()
    await feedbackBtn.click()

    // Feedback modal opens
    const feedbackModal = page.getByText(/Wie war deine Erfahrung/i)
    await expect(feedbackModal).toBeVisible()

    // Close feedback modal
    const closeFeedback = page.locator('.bg-\\[\\#1E293B\\] button:has(svg.lucide-x)')
    await closeFeedback.click()
    const modalContainer = page.locator('.bg-\\[\\#1E293B\\]').locator('..')
    await expect(modalContainer).toHaveClass(/opacity-0/)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 9. SESSIONS JOIN INTERACTION & REDIRECT FLOW
  // ──────────────────────────────────────────────────────────────────────────
  test('9. Sessions: Join Session Prompts Login for Unauthenticated Users', async ({ page }) => {
    await page.goto(`${BASE_URL}/sessions`, { waitUntil: 'networkidle' })

    // Click "Join" on the first session card (Soccer)
    const joinBtn = page.getByRole('button', { name: /Join/i }).first()
    await expect(joinBtn).toBeVisible()
    await joinBtn.click()

    // Should prompt error toast or redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('h1')).toBeVisible()
  })
})

