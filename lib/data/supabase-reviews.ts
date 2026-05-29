import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Review } from '@/types/review'

export async function supabaseListReviewsByProfessional(
  professionalId: string
): Promise<Review[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('reviews')
    .select('id, professional_id, customer_id, rating, text, created_at, users(full_name)')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[supabase] reviews', error.message)
    return null
  }

  return (data ?? []).map((row) => {
    const users = row.users as { full_name: string } | { full_name: string }[] | null
    const name = Array.isArray(users) ? users[0]?.full_name : users?.full_name

    return {
      id: row.id,
      professionalId: row.professional_id,
      customerId: row.customer_id,
      rating: row.rating,
      text: row.text,
      createdAt: row.created_at,
      customerName: name,
    }
  })
}

export async function supabaseCreateReview(input: {
  requestId: string
  professionalId: string
  rating: number
  text?: string
}): Promise<Review | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      request_id: input.requestId,
      professional_id: input.professionalId,
      customer_id: user.id,
      rating: input.rating,
      text: input.text,
    })
    .select('id, professional_id, customer_id, rating, text, created_at')
    .single()

  if (error || !data) {
    console.error('[supabase] create review', error?.message)
    return null
  }

  return {
    id: data.id,
    professionalId: data.professional_id,
    customerId: data.customer_id,
    rating: data.rating,
    text: data.text,
    createdAt: data.created_at,
  }
}
