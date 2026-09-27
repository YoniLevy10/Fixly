/**
 * Mobile performance + UX journey audit for Fixly.
 * Simulates iPhone viewport + Slow 4G and measures key customer/pro flows.
 *
 * Usage: node scripts/mobile-perf-audit.mjs [label]
 * Writes JSON to /tmp/fixly-perf-<label>.json and prints a summary.
 */
import { chromium, devices } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const LABEL = process.argv[2] ?? 'baseline'
const OUT_DIR = '/tmp/fixly-perf'
const SLOW_4G = {
  download: ((1.6 * 1024 * 1024) / 8) * 0.8,
  upload: ((750 * 1024) / 8) * 0.8,
  latency: 150,
}

function now() {
  return Date.now()
}

async function waitUseful(page, selectors, timeout = 12000) {
  const start = now()
  const result = await Promise.race(
    selectors.map(async (sel) => {
      await page.waitForSelector(sel, { state: 'visible', timeout })
      return sel
    }),
  )
    .then((selector) => ({ ok: true, selector, ms: now() - start }))
    .catch(() => ({ ok: false, selector: null, ms: now() - start }))
  return result
}

function summarizeRequests(entries) {
  const finished = entries.filter((e) => e.response)
  const failed = entries.filter(
    (e) =>
      e.failed ||
      (e.response && e.response.status >= 400 && !e.url.includes('google-analytics')),
  )
  const appEntries = entries.filter(
    (e) => e.url.startsWith(BASE) || e.url.startsWith('/'),
  )
  const slow = finished
    .filter((e) => e.url.startsWith(BASE) && e.durationMs >= 500)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 8)
    .map((e) => ({
      url: e.url.replace(BASE, ''),
      method: e.method,
      status: e.response?.status,
      ms: Math.round(e.durationMs),
      bytes: e.response?.encodedDataLength ?? 0,
    }))
  const totalBytes = finished
    .filter((e) => e.url.startsWith(BASE))
    .reduce((sum, e) => sum + (e.response?.encodedDataLength ?? 0), 0)
  return {
    requestCount: appEntries.length,
    finishedCount: finished.filter((e) => e.url.startsWith(BASE)).length,
    failedCount: failed.filter((e) => e.url.startsWith(BASE)).length,
    totalBytes,
    totalKB: Math.round(totalBytes / 1024),
    slowRequests: slow,
    errors: failed
      .filter((e) => e.url.startsWith(BASE))
      .slice(0, 10)
      .map((e) => ({
        url: e.url.replace(BASE, ''),
        method: e.method,
        status: e.response?.status ?? 'FAILED',
        failure: e.failed,
      })),
  }
}

async function measureFlow(context, name, run) {
  const page = await context.newPage()
  const entries = []
  const clickLatencies = []

  page.on('request', (req) => {
    entries.push({
      url: req.url(),
      method: req.method(),
      start: now(),
      response: null,
      failed: null,
      durationMs: 0,
    })
  })
  page.on('response', async (res) => {
    const req = res.request()
    const entry = [...entries]
      .reverse()
      .find((e) => e.url === req.url() && e.method === req.method() && !e.response)
    if (!entry) return
    let encoded = 0
    try {
      const sizes = await res.request().sizes()
      encoded = sizes.responseBodySize + sizes.responseHeadersSize
    } catch {
      try {
        const buf = await res.body()
        encoded = buf.length
      } catch {
        /* opaque */
      }
    }
    entry.response = { status: res.status(), encodedDataLength: encoded }
    entry.durationMs = now() - entry.start
  })
  page.on('requestfailed', (req) => {
    const entry = [...entries]
      .reverse()
      .find((e) => e.url === req.url() && e.method === req.method() && !e.response)
    if (entry) {
      entry.failed = req.failure()?.errorText ?? 'failed'
      entry.durationMs = now() - entry.start
    }
  })

  const wrapClick = async (locator, label) => {
    const t0 = now()
    await locator.click()
    await page.waitForTimeout(50)
    clickLatencies.push({ label, ms: now() - t0 })
  }

  const flowStart = now()
  let useful = { ok: false, ms: 0, selector: null }
  let extra = {}
  try {
    const result = await run({ page, wrapClick, waitUseful })
    useful = result.useful
    extra = result.extra ?? {}
  } catch (err) {
    extra = { error: String(err?.message ?? err) }
  }
  const totalMs = now() - flowStart
  const net = summarizeRequests(entries)
  await page.close()
  return {
    flow: name,
    timeToUsefulMs: useful.ms,
    usefulOk: useful.ok,
    usefulSelector: useful.selector,
    totalFlowMs: totalMs,
    clickLatencies,
    ...net,
    ...extra,
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const iPhone = devices['iPhone 13']
  const context = await browser.newContext({
    ...iPhone,
    locale: 'he-IL',
    geolocation: { latitude: 32.0853, longitude: 34.7818 },
    permissions: ['geolocation'],
  })
  const bootstrap = await context.newPage()
  const session = await context.newCDPSession(bootstrap)
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: SLOW_4G.latency,
    downloadThroughput: SLOW_4G.download,
    uploadThroughput: SLOW_4G.upload,
    connectionType: 'cellular3g',
  })
  await bootstrap.close()

  const results = []

  results.push(
    await measureFlow(context, 'customer_home_first_load', async ({ page, waitUseful }) => {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
      const useful = await waitUseful(page, [
        '[data-testid="home-hero"]',
        'text=זקוקים לתיקון',
        'text=Need a fix',
        'h1',
      ])
      return { useful }
    }),
  )

  results.push(
    await measureFlow(context, 'customer_search_professionals', async ({ page, wrapClick, waitUseful }) => {
      await page.goto(BASE + '/professionals', { waitUntil: 'domcontentloaded' })
      const useful = await waitUseful(page, [
        'text=אנשי מקצוע',
        'text=Find professionals',
        'input[placeholder]',
      ])
      const input = page.locator('input').first()
      if (await input.count()) {
        await input.fill('אינסטל')
        await page.waitForTimeout(400)
      }
      const chip = page.locator('button').filter({ hasText: /אינסטל|Plumbing|הכל|All/ }).first()
      if (await chip.count()) await wrapClick(chip, 'filter_chip')
      await page.waitForTimeout(600)
      return { useful }
    }),
  )

  results.push(
    await measureFlow(context, 'customer_open_profile', async ({ page, waitUseful }) => {
      await page.goto(BASE + '/professional/1', { waitUntil: 'domcontentloaded' })
      const useful = await waitUseful(page, [
        'text=שלח בקשה',
        'text=Send request',
        'text=שיחה',
        'text=Chat',
        'h1',
      ])
      return { useful }
    }),
  )

  results.push(
    await measureFlow(context, 'customer_create_request', async ({ page, waitUseful }) => {
      await page.goto(BASE + '/request/new?professional=1', { waitUntil: 'domcontentloaded' })
      const useful = await waitUseful(page, [
        'text=שלח בקשה',
        'text=New request',
        'form',
      ])
      await page.locator('input').nth(0).fill('ברז דולף במטבח')
      await page.locator('textarea').first().fill('יש נזילה מתחת לכיור כבר יומיים')

      const posts = []
      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/requests') && !req.url().includes('accept')) {
          posts.push(req.url())
        }
      })
      const submit = page.locator('button[type="submit"]').first()
      const t0 = now()
      await Promise.all([
        submit.click({ clickCount: 1 }),
        submit.click({ clickCount: 1 }).catch(() => {}),
      ])
      await page.waitForTimeout(80)
      const feedbackMs = now() - t0
      await Promise.race([
        page.waitForURL(/\/tracking\//, { timeout: 20000 }),
        page.waitForSelector('[role="alert"]', { timeout: 20000 }),
      ]).catch(() => null)

      const createdIds = await page.evaluate(async () => {
        const res = await fetch('/api/requests?limit=8')
        const data = await res.json()
        const items = Array.isArray(data) ? data : data.items ?? []
        return items
          .filter((r) => r.title === 'ברז דולף במטבח')
          .slice(0, 5)
          .map((r) => ({ id: r.id, title: r.title, createdAt: r.createdAt }))
      })
      return {
        useful,
        extra: {
          submitClickFeedbackMs: feedbackMs,
          postCreateCount: posts.length,
          duplicateTitles: createdIds.length,
          recentRequests: createdIds,
          landedOn: page.url(),
        },
      }
    }),
  )

  results.push(
    await measureFlow(context, 'customer_track_request', async ({ page, waitUseful }) => {
      const listRes = await page.request.get(BASE + '/api/requests?limit=1')
      const list = await listRes.json()
      const items = Array.isArray(list) ? list : list.items ?? []
      const id = items[0]?.id
      if (!id) return { useful: { ok: false, ms: 0, selector: null }, extra: { error: 'no request' } }
      await page.goto(BASE + `/tracking/${id}`, { waitUntil: 'domcontentloaded' })
      const useful = await waitUseful(page, [
        'text=סטטוס',
        'text=Status',
        'text=מעקב',
        'text=Track',
        '[data-testid="tracking-status"]',
      ])
      return { useful, extra: { requestId: id } }
    }),
  )

  results.push(
    await measureFlow(context, 'customer_my_requests_warm', async ({ page, waitUseful }) => {
      await page.goto(BASE + '/my-requests', { waitUntil: 'domcontentloaded' })
      const useful = await waitUseful(page, [
        'text=הבקשות שלי',
        'text=My requests',
      ])
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await page.waitForTimeout(300)
      return { useful }
    }),
  )

  results.push(
    await measureFlow(context, 'pro_dashboard', async ({ page, wrapClick, waitUseful }) => {
      await page.goto(BASE + '/pro/dashboard', { waitUntil: 'domcontentloaded' })
      const claim = page.getByRole('button', { name: /קשר לפרופיל|Claim|דמו/ })
      if (await claim.count()) {
        await wrapClick(claim.first(), 'claim_demo_pro')
        await page.waitForTimeout(800)
      }
      const useful = await waitUseful(page, [
        'text=ממתינות',
        'text=Pending',
        'text=דשבורד מקצועי',
        'text=Pro dashboard',
      ])
      const card = page.locator('button').filter({ hasText: /ממתין|pending|אינסטל|ברז|תיקון|סתימה/i }).first()
      if (await card.count()) {
        await wrapClick(card, 'open_request_sheet')
        await page.waitForTimeout(200)
        const action = page.getByRole('button', { name: /אשר|Approve|accept|קבלה/i }).first()
        if (await action.count()) {
          const posts = []
          page.on('request', (req) => {
            if (req.method() === 'PATCH' || req.url().includes('accept-invite')) {
              posts.push(req.method() + ' ' + req.url())
            }
          })
          await action.click()
          await action.click().catch(() => {})
          await page.waitForTimeout(1000)
          return { useful, extra: { doubleActionPosts: posts.length, posts } }
        }
      }
      return { useful }
    }),
  )

  results.push(
    await measureFlow(context, 'customer_offline_submit_guard', async ({ page, waitUseful }) => {
      await page.goto(BASE + '/request/new?professional=1', { waitUntil: 'domcontentloaded' })
      await waitUseful(page, ['form', 'text=שלח בקשה', 'text=New request'])
      await page.locator('input').nth(0).fill('בדיקת אופליין')
      await page.locator('textarea').first().fill('תיאור לבדיקת רשת חלשה')
      await context.setOffline(true)
      await page.waitForTimeout(200)
      const offlineBanner = await page
        .locator('[data-testid="offline-banner"]')
        .isVisible()
        .catch(() => false)
      await page.locator('button[type="submit"]').first().click().catch(() => {})
      await page.waitForTimeout(400)
      const alertVisible = await page.locator('[role="alert"]').first().isVisible().catch(() => false)
      await context.setOffline(false)
      return {
        useful: { ok: true, ms: 0, selector: 'offline-check' },
        extra: { offlineBannerVisible: offlineBanner, alertVisible },
      }
    }),
  )

  await browser.close()

  mkdirSync(OUT_DIR, { recursive: true })
  const outPath = `${OUT_DIR}/${LABEL}.json`
  const report = {
    label: LABEL,
    baseUrl: BASE,
    network: 'slow-4g-approx',
    viewport: 'iPhone 13',
    measuredAt: new Date().toISOString(),
    flows: results,
  }
  writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
