import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const baseUrl = process.env.SKILLBRIDGE_BASE_URL ?? 'http://127.0.0.1:4173'
const screenshotDir = new URL('../public/screenshots/', import.meta.url)

await fs.mkdir(screenshotDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
const consoleErrors = []
const pageErrors = []

page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push(message.text())
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

const summary = []

summary.push(await snapshotRoute('/', 'landing.png'))
summary.push(await snapshotRoute('/explore', 'explore.png'))
summary.push(await snapshotRoute('/auth', 'auth.png'))

await page.getByRole('button', { name: 'Log in' }).first().click()
await page.locator('form').getByRole('button', { name: /^Log in$/ }).click()
await page.waitForURL('**/dashboard', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({
  path: fileURLToPath(new URL('dashboard.png', screenshotDir)),
  fullPage: true,
})
summary.push({
  path: '/dashboard',
  url: page.url(),
  title: await page.title(),
  heading: await page.locator('h1, h2').first().textContent(),
  bodyLength: (await page.locator('body').innerText()).trim().length,
})

summary.push(await snapshotRoute('/chat/swap-ava-rohan', 'chat.png'))
summary.push(await snapshotRoute('/profile/ava-shah', 'profile.png'))

const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobilePage.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push(`[mobile] ${message.text()}`)
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

await browser.close()
