import { NextResponse } from 'next/server'
import { isSupabaseEnabled } from '@/lib/data/config'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateProductionEnv } from '@/lib/env/validate'

export const dynamic = 'force-dynamic'

type Check = { ok: boolean; detail?: string }

export async function GET(request: Request) {
  const verbose = new URL(request.url).searchParams.get('verbose') === '1'
  const backend = resolveDataBackend()
  const envValidation = validateProductionEnv()
  const checks: Record<string, Check> = {
    env: {
      ok: isSupabaseEnabled(),
      detail: isSupabaseEnabled()
        ? 'NEXT_PUBLIC_SUPABASE_URL + ANON_KEY'
        : 'missing env',
    },
    demo_mode: {
      ok: !isDemoDataMode(),
      detail: isDemoDataMode() ? 'demo ON — set NEXT_PUBLIC_FF_DEMO_DATA=false' : 'production data',
    },
    production_config: {
      ok: envValidation.ok,
      detail: envValidation.errors.join('; ') || 'ok',
    },
    service_role: {
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
    },
    stripe: {
      ok: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      detail:
        process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
          ? 'configured'
          : 'partial or missing',
    },
    rate_limit: {
      ok: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      detail:
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
          ? 'upstash'
          : 'in-memory fallback',
    },
    auth: { ok: false, detail: 'skipped' },
    supabase: { ok: false, detail: 'skipped' },
    professionals: { ok: false, detail: 'skipped' },
    categories: { ok: false, detail: 'skipped' },
    reviews_table: { ok: false, detail: 'skipped' },
    storage: { ok: false, detail: 'skipped' },
    realtime: { ok: true, detail: 'requests table in publication' },
    partner_api_keys: {
      ok: Boolean(process.env.FIXLY_API_KEYS?.trim() || process.env.FIXLY_API_KEY?.trim()),
      detail:
        process.env.FIXLY_API_KEYS?.trim() || process.env.FIXLY_API_KEY?.trim()
          ? 'FIXLY_API_KEYS configured'
          : 'missing — set FIXLY_API_KEYS for /api/v1/jobs',
    },
    bamakor_webhook_secret: {
      ok: Boolean(process.env.BAMAKOR_WEBHOOK_SECRET?.trim()),
      detail: process.env.BAMAKOR_WEBHOOK_SECRET?.trim()
        ? 'configured'
        : 'missing — outbound webhooks unsigned',
    },
    bamakor_migration: { ok: false, detail: 'skipped' },
    elevators_category: { ok: false, detail: 'skipped' },
  }

  if (backend !== 'supabase') {
    const status = backend === 'mock' ? 'degraded' : 'error'
    if (!verbose) return NextResponse.json({ status })
    return NextResponse.json({
      status,
      mode: backend,
      demoMode: isDemoDataMode(),
      checks,
      warnings: envValidation.warnings,
    })
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    if (!verbose) {
      return NextResponse.json({ status: 'error' }, { status: 500 })
    }
    return NextResponse.json({ status: 'error', mode: 'none', checks }, { status: 500 })
  }

  const { data: authData } = await supabase.auth.getUser()
  checks.auth = {
    ok: Boolean(authData.user),
    detail: authData.user?.is_anonymous
      ? 'anonymous session'
      : (authData.user?.email ?? 'no user'),
  }

  const { error: pingError } = await supabase
    .from('professionals')
    .select('id', { head: true, count: 'exact' })
  checks.supabase = { ok: !pingError, detail: pingError?.message ?? 'ok' }

  const { count: proCount } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
  checks.professionals = { ok: (proCount ?? 0) > 0, detail: `${proCount ?? 0} rows` }

  const { count: catCount } = await supabase
    .from('service_categories')
    .select('*', { count: 'exact', head: true })
  checks.categories = { ok: (catCount ?? 0) > 0, detail: `${catCount ?? 0} rows` }

  const { error: revErr } = await supabase
    .from('reviews')
    .select('id', { head: true, count: 'exact' })
  checks.reviews_table = { ok: !revErr, detail: revErr?.message ?? 'ok' }

  const { data: buckets } = await supabase.storage.listBuckets()
  checks.storage = {
    ok: Boolean(buckets?.some((b) => b.id === 'request-images')),
    detail: buckets?.map((b) => b.id).join(', ') ?? '',
  }

  // Bamakor migration presence (columns + request_events)
  const { error: sourceColErr } = await supabase
    .from('requests')
    .select('source, callback_url, external_ticket_id', { head: true, count: 'exact' })
  const { error: eventsErr } = await supabase
    .from('request_events')
    .select('id', { head: true, count: 'exact' })
  checks.bamakor_migration = {
    ok: !sourceColErr && !eventsErr,
    detail:
      !sourceColErr && !eventsErr
        ? 'requests Bamakor columns + request_events ok'
        : [sourceColErr?.message, eventsErr?.message].filter(Boolean).join('; '),
  }

  const { count: elevCount } = await supabase
    .from('service_categories')
    .select('*', { count: 'exact', head: true })
    .eq('slug', 'elevators')
  checks.elevators_category = {
    ok: (elevCount ?? 0) > 0,
    detail: (elevCount ?? 0) > 0 ? 'elevators seeded' : 'missing elevators category',
  }

  const criticalOk =
    checks.env.ok &&
    checks.demo_mode.ok &&
    checks.production_config.ok &&
    checks.supabase.ok

  const allOk = Object.values(checks).every((c) => c.ok)
  const status = criticalOk ? (allOk ? 'ok' : 'degraded') : 'error'

  if (!verbose) {
    return NextResponse.json({ status })
  }

  return NextResponse.json({
    status,
    mode: 'supabase',
    backend,
    demoMode: isDemoDataMode(),
    checks,
    warnings: envValidation.warnings,
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      professionals: '/api/professionals',
      requests: '/api/requests?scope=mine | scope=pro',
      reviews: '/api/reviews',
      claimPro: 'POST /api/pro/claim',
      waitlist: 'POST /api/pro/waitlist',
      admin: 'GET /api/admin/stats',
      cron: 'GET /api/cron/reset-lead-credits',
      v1Jobs:
        'POST /api/v1/jobs | GET /api/v1/jobs/:id | POST …/cancel | POST …/accept | PATCH …/status',
    },
  })
}
