import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin/is-admin'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Auth unavailable' }, { status: 503 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const admin = getAdminSupabaseClient()
    if (!admin) {
      return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
    }

    const [
      { count: professionals },
      { count: requests },
      { count: pendingRequests },
      { count: completedRequests },
      { count: waitlist },
      { count: reviews },
      { data: recentWaitlist },
      { data: recentBilling },
    ] = await Promise.all([
      admin.from('professionals').select('*', { count: 'exact', head: true }),
      admin.from('requests').select('*', { count: 'exact', head: true }),
      admin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      admin.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      admin.from('pro_waitlist').select('*', { count: 'exact', head: true }),
      admin.from('reviews').select('*', { count: 'exact', head: true }),
      admin
        .from('pro_waitlist')
        .select('id, full_name, phone, city, category, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      admin
        .from('billing_events')
        .select('id, event_type, amount_agorot, created_at, professional_id')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    return NextResponse.json({
      stats: {
        professionals: professionals ?? 0,
        requests: requests ?? 0,
        pendingRequests: pendingRequests ?? 0,
        completedRequests: completedRequests ?? 0,
        waitlist: waitlist ?? 0,
        reviews: reviews ?? 0,
      },
      recentWaitlist: recentWaitlist ?? [],
      recentBilling: recentBilling ?? [],
    })
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/stats' })
    return NextResponse.json({ error: 'Failed to load admin stats' }, { status: 500 })
  }
}
