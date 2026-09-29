/**
 * Smoke: insert a real waitlist row via service role, verify columns, delete it.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage: node --import tsx scripts/smoke-waitlist-save.ts
 */
import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    console.error('SKIP: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(0)
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const phone = `050${String(Date.now()).slice(-7)}`
  const row = {
    full_name: 'בדיקת מערכת Fixly',
    phone,
    email: null,
    category: null,
    city: 'תל אביב',
    referral_code: null,
    audience: 'customer',
    source: 'smoke_waitlist_save',
    attribution: {
      utm_source: 'smoke',
      utm_medium: 'test',
      utm_campaign: 'lead_capture_rebuild',
    },
  }

  const { data, error } = await admin
    .from('pro_waitlist')
    .insert(row)
    .select('id, audience, source, attribution')
    .maybeSingle()

  if (error) {
    console.error('INSERT FAILED', error)
    process.exit(1)
  }
  if (!data?.id) {
    console.error('INSERT returned no id')
    process.exit(1)
  }
  if (data.audience !== 'customer' || data.source !== 'smoke_waitlist_save') {
    console.error('Columns not persisted', data)
    process.exit(1)
  }

  const { error: delErr } = await admin.from('pro_waitlist').delete().eq('id', data.id)
  if (delErr) {
    console.error('CLEANUP FAILED', delErr)
    process.exit(1)
  }

  console.log('ok: waitlist save + audience/source/attribution + cleanup', data.id)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
