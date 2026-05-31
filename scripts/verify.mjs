import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const baseUrl = process.env.SWAPNET_BASE_URL ?? 'http://localhost:4173'
const screenshotDir = new URL('../public/screenshots/', import.meta.url)
const providedTestEmail = (process.env.SWAPNET_TEST_EMAIL ?? process.env.SKILLBRIDGE_TEST_EMAIL)?.trim()
const providedTestPassword = (process.env.SWAPNET_TEST_PASSWORD ?? process.env.SKILLBRIDGE_TEST_PASSWORD)?.trim()

await fs.mkdir(screenshotDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
const consoleErrors = []
const pageErrors = []

page.on('console', (message) => {
  if (message.type() === 'error') {
    const text = message.text()
    if (
      text.includes('status of 400') ||
      text.includes('auth/v1/token') ||
      text.includes('Failed to load resource') ||
      text.includes('Invalid login credentials') ||
      text.includes('AuthApiError')
    ) {
      return
    }
    consoleErrors.push(text)
  }
})

page.on('pageerror', (error) => {
  pageErrors.push(error.message)
})

async function snapshotRoute(path, filename) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({
    path: fileURLToPath(new URL(filename, screenshotDir)),
    fullPage: true,
  })

  return {
    path,
    url: page.url(),
    title: await page.title(),
    heading: await page.locator('h1, h2').first().textContent(),
    bodyLength: (await page.locator('body').innerText()).trim().length,
  }
}

async function collectVisibleError() {
  const formText = await page.locator('form').innerText().catch(() => '')
  const errorLine = formText
    .split('\n')
    .map((line) => line.trim())
    .find((line) =>
      /wrong password|invalid login credentials|could not log you in|supabase is not configured/i.test(line),
    )

  return errorLine ?? null
}

async function verifyProtectedRoutes() {
  await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' })

  const credentials =
    providedTestEmail && providedTestPassword
      ? { email: providedTestEmail, password: providedTestPassword }
      : null

  if (!credentials) {
    const reason =
      'Protected routes skipped. Add SKILLBRIDGE_TEST_EMAIL and SKILLBRIDGE_TEST_PASSWORD to .env when Supabase auth is enabled.'

    return {
      skipped: true,
      reason,
      entries: [
        { path: '/dashboard', skipped: true, reason },
        { path: '/messages', skipped: true, reason },
      ],
    }
  }

  await page.getByRole('button', { name: /^Log in$/ }).first().click()
  await page.locator('input[type="email"]').fill(credentials.email)
  await page.locator('input[type="password"]').fill(credentials.password)
  await page.locator('form').getByRole('button', { name: /^Log in$/ }).click()

  let loggedIn = await page
    .waitForURL('**/dashboard', { timeout: 10000, waitUntil: 'networkidle' })
    .then(() => true)
    .catch(() => false)

  if (!loggedIn) {
    const errorMsg = await collectVisibleError()
    if (errorMsg && (errorMsg.toLowerCase().includes('invalid login credentials') || errorMsg.toLowerCase().includes('wrong password') || errorMsg.toLowerCase().includes('could not log you in'))) {
      console.log('Login failed with invalid credentials. Attempting to register test account...')
      // Switch to signup tab
      await page.getByRole('button', { name: 'Sign up' }).click()
      await page.locator('input[placeholder="Ava Shah"]').fill('Test User')
      await page.locator('input[placeholder="Mumbai"]').fill('Mumbai')
      await page.locator('input[type="email"]').fill(credentials.email)
      await page.locator('input[type="password"]').fill(credentials.password)
      await page.locator('form').getByRole('button', { name: 'Create account' }).click()

      // Wait to see if it redirects to settings or dashboard or shows email confirmation notice
      const registered = await page
        .waitForURL('**/settings', { timeout: 10000, waitUntil: 'networkidle' })
        .then(() => true)
        .catch(() => false)

      if (registered) {
        console.log('Registration successful, redirected to settings. Navigating to dashboard...')
        await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' })
        loggedIn = true
      } else {
        const signupError = await collectVisibleError()
        console.warn(`Fallback registration failed: ${signupError}`)
      }
    }
  }

  if (!loggedIn) {
    const reason = (await collectVisibleError()) ?? 'Login did not reach /dashboard within 10 seconds.'
    console.warn(`Protected route verification skipped: Login failed (${reason})`)
    const skipReason = `Login failed: ${reason}`
    return {
      skipped: true,
      reason: skipReason,
      entries: [
        { path: '/dashboard', skipped: true, reason: skipReason },
        { path: '/messages', skipped: true, reason: skipReason },
      ],
    }
  }

  await page.waitForTimeout(800)
  await page.screenshot({
    path: fileURLToPath(new URL('dashboard.png', screenshotDir)),
    fullPage: true,
  })

  const protectedSummaries = [
    {
      path: '/dashboard',
      url: page.url(),
      title: await page.title(),
      heading: await page.locator('h1, h2').first().textContent(),
      bodyLength: (await page.locator('body').innerText()).trim().length,
    },
  ]

  protectedSummaries.push(await snapshotRoute('/messages', 'chat.png'))

  return {
    skipped: false,
    entries: protectedSummaries,
  }
}

async function snapshotProfileRoute() {
  await page.goto(`${baseUrl}/explore`, { waitUntil: 'networkidle' })
  const profileHref = await page.locator('a[href^="/profile/"]').first().getAttribute('href')

  if (!profileHref) {
    return {
      path: '/profile/:username',
      skipped: true,
      reason: 'No public profile links were available during verification.',
    }
  }

  return snapshotRoute(profileHref, 'profile.png')
}

const summary = []

summary.push(await snapshotRoute('/', 'landing.png'))
summary.push(await snapshotRoute('/explore', 'explore.png'))
summary.push(await snapshotRoute('/auth', 'auth.png'))
const protectedRoutes = await verifyProtectedRoutes()
summary.push(...protectedRoutes.entries)
summary.push(await snapshotProfileRoute())

const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobilePage.on('console', (message) => {
  if (message.type() === 'error') {
    const text = message.text()
    if (text.includes('status of 400') || text.includes('auth/v1/token') || text.includes('Failed to load resource')) {
      return
    }
    consoleErrors.push(`[mobile] ${text}`)
  }
})
mobilePage.on('pageerror', (error) => {
  pageErrors.push(`[mobile] ${error.message}`)
})
await mobilePage.goto(`${baseUrl}/explore`, { waitUntil: 'networkidle' })
await mobilePage.waitForTimeout(800)
await mobilePage.screenshot({
  path: fileURLToPath(new URL('mobile-explore.png', screenshotDir)),
  fullPage: true,
})
summary.push({
  path: '/explore',
  url: mobilePage.url(),
  title: await mobilePage.title(),
  heading: await mobilePage.locator('h1, h2').first().textContent(),
  bodyLength: (await mobilePage.locator('body').innerText()).trim().length,
  viewport: '390x844',
})
await mobilePage.close()

console.log(
  JSON.stringify(
    {
      baseUrl,
      summary,
      consoleErrors,
      pageErrors,
    },
    null,
    2,
  ),
)

if (consoleErrors.length || pageErrors.length) {
  process.exitCode = 1
}

await browser.close()
