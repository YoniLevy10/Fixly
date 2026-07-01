import { getSupabaseClient } from '@/lib/supabase/client'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'סוג קובץ לא נתמך — JPG, PNG או WebP בלבד'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'הקובץ גדול מדי — עד 5MB'
  }
  return null
}

export async function uploadRequestImage(file: File): Promise<string | null> {
  const validationError = validateImageFile(file)
  if (validationError) {
    console.error('[storage] validation', validationError)
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) return null

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `${crypto.randomUUID()}.${safeExt}`

  const { error } = await supabase.storage.from('request-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) {
    console.error('[storage] upload', error.message)
    return null
  }

  const { data } = supabase.storage.from('request-images').getPublicUrl(path)
  return data.publicUrl
}
