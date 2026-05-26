import { supabase } from '@/lib/supabase'

export const requestService = {
  async getRequests() {
    return supabase
      .from('requests')
      .select('*')
      .order('created_at', {
        ascending: false,
      })
  },

  async getRequest(id: string) {
    return supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()
  },

  async updateStatus(id: string, status: string) {
    return supabase
      .from('requests')
      .update({ status })
      .eq('id', id)
  },
}
