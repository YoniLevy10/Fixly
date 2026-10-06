import { test, expect } from '@playwright/test'

// Keep mocked API traffic in Playwright rather than the production PWA worker.
test.use({ serviceWorkers: 'block' })

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

  test('waitlist registers professionals with multiple professions', async ({ page }) => {
    // CI has no Supabase — route proves UI success only after a real API id.
    await page.route('**/api/waitlist', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      const body = route.request().postDataJSON() as { audience?: string; categories?: string[] }
      expect(body.audience).toBe('professional')
      expect(body.categories).toEqual(['אינסטלטורים', 'חשמלאים'])
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          audience: body.audience ?? 'customer',
          id: '11111111-2222-4333-8444-555555555555',
        }),
      })
    })

    await page.goto('/waitlist')
    await expect(page.getByRole('heading', { name: /עבודות אמיתיות/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /הרשמה מוקדמת/i })).toBeVisible()
    const form = page.locator('#waitlist.opacity-100').first()
    await expect(form).toBeVisible()
    await form.getByRole('button', { name: /בחרו תחומים/ }).click()
    await form.getByRole('button', { name: 'אינסטלטורים', exact: true }).click()
    await form.getByRole('button', { name: 'חשמלאים', exact: true }).click()
    await form.getByRole('button', { name: '2 תחומים נבחרו', exact: true }).click()
    await page.locator('#waitlist.opacity-100').first().getByLabel(/שם מלא/i).fill('בדיקת מערכת')
    await page.locator('#waitlist.opacity-100').first().getByLabel(/טלפון/i).fill('0501234567')
    await page.locator('#waitlist.opacity-100').first().getByRole('button', { name: /הצטרפו|שמרו לי מקום|שמרו אותי/i }).click()
    await expect(page.locator('#waitlist.opacity-100').first().getByText(/נרשמתם בהצלחה/i)).toBeVisible({ timeout: 10_000 })
  })

  test('waitlist shows error when save is rejected', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'שמירה נכשלה — מסד הנתונים לא מוגדר' }),
      })
    })

    await page.goto('/waitlist')
    const form = page.locator('#waitlist.opacity-100').first()
    await form.getByRole('button', { name: /בחרו תחומים/ }).click()
    await form.getByRole('button', { name: 'אינסטלטורים', exact: true }).click()
    await form.getByRole('button', { name: '1 תחומים נבחרו', exact: true }).click()
    await form.getByLabel(/שם מלא/i).fill('בדיקת מערכת')
    await page.locator('#waitlist.opacity-100').first().getByLabel(/טלפון/i).fill('0501234567')
    await page.locator('#waitlist.opacity-100').first().getByRole('button', { name: /הצטרפו|שמרו לי מקום|שמרו אותי/i }).click()
    await expect(
      page.locator('#waitlist.opacity-100').first().getByText(/שמירה נכשלה|מסד הנתונים לא מוגדר/i),
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/נרשמתם בהצלחה/i)).toHaveCount(0)
  })

  test('pro join redirects to unified waitlist', async ({ page }) => {
    await page.goto('/pro/join')
    await expect(page).toHaveURL(/\/waitlist\?audience=professional/)
    await expect(page.locator('#waitlist.opacity-100').first().getByRole('button', { name: /בחרו תחומים/ })).toBeVisible()
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
