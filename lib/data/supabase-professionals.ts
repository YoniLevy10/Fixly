import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mapProfessionalRow } from '@/lib/data/supabase-mappers'
import type { Professional } from '@/types/professional'

/**
 * Columns that exist on production `professionals` (Supabase ref
 * lfzxvmievofvdhxrwggo). Do not add `midrag_*` here: those columns are not
 * in production, and selecting them raises Postgres 42703 on every read.
 * The fallback used to retry without them, but the first query still logged
 * the error. Re-add the columns only after applying
 * supabase/migrations/20260812000000_midrag_integration.sql
 * (also repeated in 20260904120000_fix_professionals_catalog.sql).
 * `updated_at` is likewise absent; do not select or write it.
 */
export const PROFESSIONALS_PUBLIC_SELECT = `
  id,
  title,
  description,
  category_id,
  rating,
  reviews_count,
  hourly_price,
  city,
  available,
  profile_image,
  phone,
  whatsapp_number,
  is_verified,
  avg_response_minutes,
  availability_summary,
  subscription_tier,
  subscription_until,
  jobs_completed,
  performance_score,
  accept_rate,
  service_categories ( name, name_he, slug )
`

async function selectProfessionals(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  id?: string
) {
  const base = supabase.from('professionals').select(PROFESSIONALS_PUBLIC_SELECT)
  return id
    ? await base.eq('id', id).maybeSingle()
    : await base.order('performance_score', { ascending: false, nullsFirst: false })
}

export async function supabaseListProfessionals(): Promise<Professional[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await selectProfessionals(supabase)

  if (error) {
    console.error('[supabase] list professionals', error.message)
    return null
  }

  return ((data as unknown[]) ?? []).map((row) =>
    mapProfessionalRow(row as Parameters<typeof mapProfessionalRow>[0])
  )
}

export async function supabaseGetProfessionalById(
  id: string
): Promise<Professional | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await selectProfessionals(supabase, id)

  if (error || !data) return null
  return mapProfessionalRow(data as Parameters<typeof mapProfessionalRow>[0])
}

export async function supabaseGetFeaturedProfessionals(): Promise<
  Professional[] | null
> {
  const list = await supabaseListProfessionals()
  if (!list) return null
  return list.filter((p) => p.isFeatured && p.isAvailable).slice(0, 6)
}
