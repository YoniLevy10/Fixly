import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/admin/require-admin-api'
import { listProWaitlistEntries } from '@/lib/data/pro-waitlist-store'
import { isSupabaseEnabled } from '@/lib/data/config'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

function mapMemoryWaitlist() {
  return listProWaitlistEntries()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)
    .map((e) => ({
      id: e.id,
      full_name: e.fullName,
      phone: e.phone,
      email: e.email ?? null,
      city: e.city ?? null,
      category: e.category ?? null,
      audience: e.audience,
      source: e.source ?? null,
      referral_code: e.referralCode ?? null,
      attribution: e.attribution ?? null,
      created_at: e.createdAt,
    }))
}

export async function GET() {
  try {
    const access = await requireAdminAccess()
    if (!access.ok) return access.response

    const { admin } = access

    const [
      professionals,
      requests,
      pendingRequests,
      completedRequests,
      waitlist,
      reviews,
      bamakorRequests,
      escalatedRequests,
      recentWaitlist,
      recentBilling,
      prospects,
      prospectNew,
      prospectContacted,
      customerWaitlist,
      professionalWaitlist,
    ] = await Promise.all([
      admin.from('professionals').select('*', { count: 'exact', head: true }),
      admin.from('requests').select('*', { count: 'exact', head: true }),
      admin
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      admin
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      admin.from('pro_waitlist').select('*', { count: 'exact', head: true }),
      admin.from('reviews').select('*', { count: 'exact', head: true }),
      admin
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'bamakor'),
      admin
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .not('escalation_source', 'is', null),
      admin
        .from('pro_waitlist')
        .select(
          'id, full_name, phone, email, city, category, audience, source, referral_code, attribution, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(50),
      admin
        .from('billing_events')
        .select('id, event_type, amount_agorot, created_at, professional_id')
        .order('created_at', { ascending: false })
        .limit(20),
      admin
        .from('professional_prospects')
        .select('*', { count: 'exact', head: true }),
      admin
        .from('professional_prospects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new'),
      admin
        .from('professional_prospects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'contacted'),
      admin
        .from('pro_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('audience', 'customer'),
      admin
        .from('pro_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('audience', 'professional'),
    ])

    let waitlistRows = recentWaitlist.data ?? []
    let waitlistCount = waitlist.count ?? 0
    let storage: 'supabase' | 'memory' | 'mixed' = 'supabase'

    const memory = mapMemoryWaitlist()
    // Only surface memory when Supabase is intentionally off (local/demo).
    // Never mask a real empty Supabase table with process-local leftovers.
    if (!isSupabaseEnabled() && memory.length > 0) {
      waitlistRows = memory
      waitlistCount = memory.length
      storage = 'memory'
    }

    return NextResponse.json({
      via: access.via,
      storage,
      stats: {
        professionals: professionals.count ?? 0,
        requests: requests.count ?? 0,
        pendingRequests: pendingRequests.count ?? 0,
        completedRequests: completedRequests.count ?? 0,
        waitlist: waitlistCount,
        waitlistCustomers: customerWaitlist.count ?? 0,
        waitlistProfessionals: professionalWaitlist.count ?? 0,
        reviews: reviews.count ?? 0,
        bamakorRequests: bamakorRequests.count ?? 0,
        escalatedRequests: escalatedRequests.count ?? 0,
        prospects: prospects.count ?? 0,
        prospectsNew: prospectNew.count ?? 0,
        prospectsContacted: prospectContacted.count ?? 0,
      },
      recentWaitlist: waitlistRows,
      recentBilling: recentBilling.data ?? [],
    })
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/stats' })
    return NextResponse.json({ error: 'Failed to load admin stats' }, { status: 500 })
  }
}
