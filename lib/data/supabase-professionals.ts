import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mapProfessionalRow } from '@/lib/data/supabase-mappers'
import type { Professional } from '@/types/professional'

const PRO_SELECT = `
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
  service_categories ( name, name_he, slug )
`

export async function supabaseListProfessionals(): Promise<Professional[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('professionals')
    .select(PRO_SELECT)
    .order('rating', { ascending: false })

  if (error) {
    console.error('[supabase] list professionals', error.message)
    return null
  }

  return (data ?? []).map((row) => mapProfessionalRow(row))
}

export async function supabaseGetProfessionalById(
  id: string
): Promise<Professional | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('professionals')
    .select(PRO_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return mapProfessionalRow(data)
}

export async function supabaseGetFeaturedProfessionals(): Promise<
  Professional[] | null
> {
  const list = await supabaseListProfessionals()
  if (!list) return null
  return list.filter((p) => p.isFeatured && p.isAvailable).slice(0, 6)
}
