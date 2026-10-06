import { expect, test } from '@playwright/test'

// Production PWA workers forward API requests outside page.route interception.
// Block them in this mocked-provider suite so requests cannot escape fixtures.
test.use({ serviceWorkers: 'block' })

const audience = { count: 12, total: 16, excluded: 3, duplicates: 1, snapshot: 'a'.repeat(64), configured: true }

test('SMS composer sends once, shows provider acceptance, and retains campaign after reload', async ({ page }) => {
  let posts = 0
  await page.route('**/api/admin/prospects/sms*', async route => {
    if (route.request().method() === 'POST') {
      posts++
      const body = route.request().postDataJSON()
      expect(body.message).toBe('שלום מאת Fixly')
      expect(body.snapshot).toBe(audience.snapshot)
      await route.fulfill({ json: { campaign: { id: body.id, status: 'accepted', recipient_count: 12, shipment_id: 'shipment-test' } } })
    } else if (route.request().url().includes('?id=')) {
      await route.fulfill({ json: { campaign: { id: new URL(route.request().url()).searchParams.get('id'), status: 'accepted', recipient_count: 12, shipment_id: 'shipment-test' } } })
    } else await route.fulfill({ json: audience })
  })
  await page.goto('/superadmin/sms')
  const send = page.getByRole('button', { name: 'שלח SMS ל־12 נמענים' })
  await expect(send).toBeDisabled()
  await page.getByLabel('ההודעה שלך').fill('שלום מאת Fixly')
  await send.click()
  await expect(page.getByText('019 קיבל את ההודעה לשליחה ל־12 נמענים.')).toBeVisible()
  await expect(send).toHaveCount(0)
  await page.reload()
  await expect(page.getByLabel('ההודעה שלך')).toHaveValue('שלום מאת Fixly')
  await expect(page.getByLabel('ההודעה שלך')).toBeDisabled()
  await page.getByRole('button', { name: 'בדיקת מצב השליחה' }).click()
  await expect(page.getByText('019 קיבל את ההודעה לשליחה ל־12 נמענים.')).toBeVisible()
  expect(posts).toBe(1)
})

test('missing 019 setup disables sending', async ({ page }) => {
  await page.route('**/api/admin/prospects/sms', route => route.fulfill({ json: { ...audience, configured: false } }))
  await page.goto('/superadmin/sms')
  await page.getByLabel('ההודעה שלך').fill('שלום')
  await expect(page.getByRole('button', { name: 'שלח SMS ל־12 נמענים' })).toBeDisabled()
  await expect(page.getByText('חיבור 019 עדיין לא הוגדר. השליחה תהיה זמינה לאחר חיבור החשבון.')).toBeVisible()
})

test('lost response allows only same-ID retry and no new campaign', async ({ page }) => {
  const ids: string[] = []
  await page.route('**/api/admin/prospects/sms*', async route => {
    if (route.request().method() === 'POST') {
      ids.push(route.request().postDataJSON().id)
      if (ids.length === 1) await route.abort('failed')
      else await route.fulfill({ json: { campaign: { id: ids[0], status: 'accepted', recipient_count: 12, shipment_id: 'shipment-test' } } })
    } else if (route.request().url().includes('?id=')) await route.fulfill({ json: { campaign: null } })
    else await route.fulfill({ json: audience })
  })
  await page.goto('/superadmin/sms')
  await page.getByLabel('ההודעה שלך').fill('שלום מאת Fixly')
  await page.getByRole('button', { name: 'שלח SMS ל־12 נמענים' }).click()
  await page.getByRole('button', { name: 'בדיקת מצב השליחה' }).click()
  await page.getByRole('button', { name: 'ניסיון חוזר עם אותו מזהה' }).click()
  await expect(page.getByText('019 קיבל את ההודעה לשליחה ל־12 נמענים.')).toBeVisible()
  expect(ids).toHaveLength(2)
  expect(ids[0]).toBe(ids[1])
})

test('SMS APIs reject unauthenticated callers', async ({ request }) => {
  const preview = await request.get('/api/admin/prospects/sms')
  expect(preview.status()).toBe(401)
  const send = await request.post('/api/admin/prospects/sms', { data: { message: 'unauthorized' } })
  expect(send.status()).toBe(401)
  const cron = await request.get('/api/cron/signup-sms-notifications')
  expect(cron.status()).toBe(401)
})
