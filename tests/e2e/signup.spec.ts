import { test, expect, devices, type Page } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

async function fillProWaitlist(
  page: Page,
  opts: { name?: string; phone?: string; professions?: string[] } = {},
) {
  const form = page.locator('#waitlist').first()
  await expect(form).toBeVisible()
  // No modal overlay — phone fill must work with no prior dismiss click.
  await form.locator('input[name="phone"]').fill(opts.phone ?? '0501234567')
  await form.locator('input[name="fullName"]').fill(opts.name ?? 'בדיקת הרשמה')
  await form.getByRole('button', { name: /בחרו תחומים/ }).click()
  for (const profession of opts.professions ?? ['אינסטלטורים']) {
    await form.getByRole('button', { name: profession, exact: true }).click()
  }
  const selectedCount = opts.professions?.length ?? 1
  await form
    .getByRole('button', { name: `${selectedCount} תחומים נבחרו`, exact: true })
    .click()
}

async function mockWaitlistOk(page: Page) {
  await page.route('**/api/waitlist', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        audience: 'professional',
        id: '11111111-2222-4333-8444-555555555555',
      }),
    })
  })
}

test.describe('signup waitlist (mocked)', () => {
  test('happy path without dismissing an overlay', async ({ page }) => {
    await mockWaitlistOk(page)
    await page.goto('/waitlist')
    await fillProWaitlist(page)
    await page
      .locator('#waitlist')
      .first()
      .getByRole('button', { name: /הצטרפות|הצטרפו|שמרו לי מקום|שמרו אותי/i })
      .click()
    await expect(page.locator('#waitlist').first().getByText('נרשמתם', { exact: true })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('shows RATE_LIMITED copy on 429', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '60' },
        body: JSON.stringify({ error: 'rate', code: 'RATE_LIMITED' }),
      })
    })
    await page.goto('/waitlist')
    await fillProWaitlist(page)
    await page
      .locator('#waitlist')
      .first()
      .getByRole('button', { name: /הצטרפות|הצטרפו|שמרו לי מקום|שמרו אותי/i })
      .click()
    await expect(
      page.locator('#waitlist').first().getByText(/יותר מדי ניסיונות/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows GEO_BLOCKED copy on 403', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'השירות זמין בישראל בלבד',
          code: 'GEO_BLOCKED',
        }),
      })
    })
    await page.goto('/waitlist')
    await fillProWaitlist(page)
    await page
      .locator('#waitlist')
      .first()
      .getByRole('button', { name: /הצטרפות|הצטרפו|שמרו לי מקום|שמרו אותי/i })
      .click()
    await expect(
      page.locator('#waitlist').first().getByText(/זמין בישראל בלבד/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows temporary save error on 5xx', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'שמירה נכשלה',
          code: 'STORAGE_UNAVAILABLE',
        }),
      })
    })
    await page.goto('/waitlist')
    await fillProWaitlist(page)
    await page
      .locator('#waitlist')
      .first()
      .getByRole('button', { name: /הצטרפות|הצטרפו|שמרו לי מקום|שמרו אותי/i })
      .click()
    await expect(
      page.locator('#waitlist').first().getByText(/שגיאה זמנית בשמירה/i),
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('signup mobile viewports', () => {
  for (const [label, device] of [
    ['Pixel 7', devices['Pixel 7']],
    ['iPhone 15', devices['iPhone 15']],
  ] as const) {
    test(`${label}: form fills without overlay`, async ({ browser }) => {
      const context = await browser.newContext({ ...device, serviceWorkers: 'block' })
      const page = await context.newPage()
      await mockWaitlistOk(page)
      await page.goto('/waitlist')
      await page.locator('input[name="phone"]').fill('0501234567')
      await expect(page.locator('input[name="phone"]')).toHaveValue('0501234567')
      await context.close()
    })
  }
})

test.describe('signup live @live', () => {
  test.skip(
    process.env.LIVE_SIGNUP_TEST !== '1',
    'Set LIVE_SIGNUP_TEST=1 to hit a real waitlist backend',
  )

  test('live professional signup round-trip', async ({ page }) => {
    const phone = `050${String(Date.now()).slice(-7)}`
    await page.goto('/waitlist')
    await fillProWaitlist(page, {
      name: 'בדיקת לייב',
      phone,
      professions: ['חשמלאים'],
    })
    await page
      .locator('#waitlist')
      .first()
      .getByRole('button', { name: /הצטרפות|הצטרפו|שמרו לי מקום|שמרו אותי/i })
      .click()
    await expect(page.locator('#waitlist').first().getByText('נרשמתם', { exact: true })).toBeVisible({
      timeout: 20_000,
    })
  })
})
