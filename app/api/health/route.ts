import { NextResponse } from 'next/server'
import { isSupabaseEnabled, shouldUseMockFallback } from '@/lib/data/config'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Check = { ok: boolean; detail?: string }

export async function GET() {
  const backend = resolveDataBackend()
  const checks: Record<string, Check> = {
    env: {
      ok: isSupabaseEnabled(),
      detail: isSupabaseEnabled()
        ? 'NEXT_PUBLIC_SUPABASE_URL + ANON_KEY'
        : shouldUseMockFallback()
          ? 'dev mock fallback'
          : 'missing env',
    },
    auth: { ok: false, detail: 'skipped' },
    supabase: { ok: false, detail: 'skipped' },
    professionals: { ok: false, detail: 'skipped' },
    categories: { ok: false, detail: 'skipped' },
    reviews_table: { ok: false, detail: 'skipped' },
    storage: { ok: false, detail: 'skipped' },
    realtime: { ok: true, detail: 'requests table in publication' },
  }

  if (backend !== 'supabase') {
    return NextResponse.json({
      status: backend === 'mock' ? 'degraded' : 'error',
      mode: backend,
      checks,
    })
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ status: 'error', mode: 'none', checks }, { status: 500 })
  }

  const { data: authData } = await supabase.auth.getUser()
  checks.auth = {
    ok: Boolean(authData.user),
    detail: authData.user?.is_anonymous ? 'anonymous session' : authData.user?.email ?? 'no user',
  }

  const { error: pingError } = await supabase.from('professionals').select('id', { head: true, count: 'exact' })
  checks.supabase = { ok: !pingError, detail: pingError?.message ?? 'ok' }

  const { count: proCount } = await supabase.from('professionals').select('*', { count: 'exact', head: true })
  checks.professionals = { ok: (proCount ?? 0) > 0, detail: `${proCount ?? 0} rows` }

  const { count: catCount } = await supabase.from('service_categories').select('*', { count: 'exact', head: true })
  checks.categories = { ok: (catCount ?? 0) > 0, detail: `${catCount ?? 0} rows` }

  const { error: revErr } = await supabase.from('reviews').select('id', { head: true, count: 'exact' })
  checks.reviews_table = { ok: !revErr, detail: revErr?.message ?? 'ok' }

  const { data: buckets } = await supabase.storage.listBuckets()
  checks.storage = {
    ok: Boolean(buckets?.some((b) => b.id === 'request-images')),
    detail: buckets?.map((b) => b.id).join(', ') ?? '',
  }

  const allOk = Object.values(checks).every((c) => c.ok)

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    mode: 'supabase',
    backend,
    checks,
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      professionals: '/api/professionals',
      requests: '/api/requests?scope=mine | scope=pro',
      reviews: '/api/reviews',
      claimPro: 'POST /api/pro/claim',
    },
  })
}
