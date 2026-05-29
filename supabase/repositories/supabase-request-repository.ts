import type { MarketplaceRequest } from '@/types/marketplace-request'
import type { RequestRepository } from '@/lib/repositories/request-repository'
import { getSupabaseClient } from '@/lib/supabase/client'

function requireSupabase() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

export const supabaseRequestRepository: RequestRepository = {
  async getAll() {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description || undefined,
      customerId: request.customer_id,
      professionalId: request.professional_id || undefined,
      categoryId: request.category_id,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    })) as MarketplaceRequest[]
  },

  async create(request) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('requests').insert({
      id: request.id,
      title: request.title,
      description: request.description,
      customer_id: request.customerId,
      professional_id: request.professionalId,
      category_id: request.categoryId,
      status: request.status,
      created_at: request.createdAt,
      updated_at: request.updatedAt,
    })

    if (error) {
      throw error
    }
  },
}
