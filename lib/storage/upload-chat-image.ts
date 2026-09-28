import { getSupabaseClient } from '@/lib/supabase/client'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { validateImageFile } from '@/lib/storage/upload-request-image'

/** Upload a chat attachment. Demo returns a data-URL so the bubble shows the real photo. */
export async function uploadChatImage(file: File): Promise<string | null> {
  const validationError = validateImageFile(file)
  if (validationError) {
    console.error('[chat-storage] validation', validationError)
    return null
  }

  if (isDemoDataMode()) {
    return readFileAsDataUrl(file)
  }

  const supabase = getSupabaseClient()
  if (!supabase) return null

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `chat/${crypto.randomUUID()}.${safeExt}`

  const { error } = await supabase.storage.from('request-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) {
    console.error('[chat-storage] upload', error.message)
    return null
  }

  const { data } = supabase.storage.from('request-images').getPublicUrl(path)
  return data.publicUrl
}

function readFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      resolve(typeof result === 'string' ? result : null)
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
