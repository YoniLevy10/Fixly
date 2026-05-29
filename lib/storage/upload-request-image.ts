import { getSupabaseClient } from '@/lib/supabase/client'

export async function uploadRequestImage(file: File): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('request-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    console.error('[storage] upload', error.message)
    return null
  }

  const { data } = supabase.storage.from('request-images').getPublicUrl(path)
  return data.publicUrl
}
