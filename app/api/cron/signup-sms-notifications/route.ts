import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { deliverSignupNotification, signupNotificationsEnabled } from '@/lib/sms/signup-notify'
import { sms019Configured } from '@/lib/sms/019'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!signupNotificationsEnabled()) return NextResponse.json({ status: 'disabled' })
  if (!sms019Configured()) return NextResponse.json({ status: 'not_configured' })
  const admin = getAdminSupabaseClient()
  if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
  try {
    const pending = await admin.from('signup_sms_notifications').select('waitlist_id')
      .eq('status', 'pending').order('created_at').limit(10)
    if (pending.error) throw pending.error
    const outcomes = await Promise.allSettled((pending.data ?? []).map(row => deliverSignupNotification(admin, row.waitlist_id)))
    outcomes.forEach(result => { if (result.status === 'rejected') trackError(result.reason, { route: 'signup-sms-cron' }) })
    return NextResponse.json({ processed: outcomes.length, failed: outcomes.filter(r => r.status === 'rejected').length })
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/signup-sms-notifications' })
    return NextResponse.json({ error: 'Notification processing failed' }, { status: 500 })
  }
}
