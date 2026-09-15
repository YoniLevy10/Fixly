import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

test.describe('public pages', () => {
  test('home loads waitlist or marketplace', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Fixly/i)
    // Prelaunch has multiple identical CTAs; marketplace has a search field.
    // Use .first() — locale boot can briefly leave duplicate nodes under strict mode.
    const waitlistCta = page
      .getByRole('link', { name: /הצטרפו בחינם|הצטרפו לרשימה/i })
      .first()
    const search = page
      .getByPlaceholder(/מה צריך לתקן|What needs fixing/i)
      .first()
    await expect(waitlistCta.or(search)).toBeVisible()
  })

  test('waitlist page collects early access signups', async ({ page }) => {
    await page.goto('/waitlist')
    await expect(page.getByRole('heading', { name: /יש תקלה בבית/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /הרשמה מוקדמת/i })).toBeVisible()
    // Customer-only demand landing — pros use /pro/join (no audience tabs).
    await expect(page.getByRole('tab')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /הצטרפו כאן/i }).first()).toBeVisible()
    await page.getByLabel(/שם מלא/i).fill('בדיקת מערכת')
    await page.getByLabel(/טלפון/i).fill('0501234567')
    await page.getByRole('button', { name: /הצטרפו|שמרו לי מקום|שמרו אותי/i }).click()
    await expect(page.getByText(/נרשמתם בהצלחה/i)).toBeVisible({ timeout: 10_000 })
  })

  test('pro join page is outreach destination', async ({ page }) => {
    await page.goto('/pro/join')
    await expect(page.getByRole('heading', { name: /הצטרפות ל-Fixly|Join Fixly/i })).toBeVisible()
    await expect(page.getByText(/לבעלי מקצוע/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /הירשם|Sign up/i })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /הרשמה מוקדמת ללקוחות/i })
    ).toBeVisible()
  })

  test('robots and sitemap are public', async ({ request }) => {
    const robots = await request.get(`${BASE}/robots.txt`)
    expect(robots.status()).toBe(200)
    const robotsText = await robots.text()
    expect(robotsText).toMatch(/sitemap/i)

    const sitemap = await request.get(`${BASE}/sitemap.xml`)
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    expect(xml).toContain('waitlist')
  })

  test('professionals directory loads', async ({ page }) => {
    await page.goto('/professionals')
    await expect(page).toHaveURL(/\/professionals/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('new request form loads', async ({ page }) => {
    await page.goto('/request/new')
    await expect(page).toHaveURL(/\/request\/new/)
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('/tracking redirects to my-requests', async ({ page }) => {
    await page.goto('/tracking')
    await expect(page).toHaveURL(/\/my-requests/)
  })
})

test.describe('API', () => {
  test('GET /api/health responds', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect([200, 500, 503]).toContain(res.status())
    const json = await res.json()
    expect(json).toHaveProperty('mode')
    expect(json).toHaveProperty('checks')
  })

  test('GET /api/categories returns array in demo mode', async ({ request }) => {
    const res = await request.get(`${BASE}/api/categories`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  test('POST /api/requests rejects invalid body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/requests`, {
      data: { description: 'x' },
    })
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  test('POST /api/reviews rejects invalid body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/reviews`, {
      data: { rating: 10 },
    })
    expect([400, 503]).toContain(res.status())
  })

  test('POST /api/billing/checkout requires auth', async ({ request }) => {
    const res = await request.post(`${BASE}/api/billing/checkout`)
    expect([401, 503]).toContain(res.status())
  })
})
