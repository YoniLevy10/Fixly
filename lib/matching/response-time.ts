import { getAdminSupabaseClient } from '@/lib/supabase/admin'

/** Record response time when pro accepts a request */
export async function recordProResponseTime(
  professionalId: string,
  requestCreatedAt: string,
): Promise<void> {
  const supabase = getAdminSupabaseClient()
  if (!supabase) return

  const created = new Date(requestCreatedAt).getTime()
  const minutes = Math.max(1, Math.round((Date.now() - created) / 60_000))

  await supabase.rpc('update_pro_response_time', {
    p_pro_id: professionalId,
    p_minutes: minutes,
  })
}

export function formatResponseTime(minutes: number | null | undefined, locale: string): string | null {
  if (minutes == null || minutes <= 0) return null
  if (minutes < 60) {
    return locale === 'en' ? `Responds in ~${minutes} min` : `מגיב בדרך כלל תוך ${minutes} דק'`
  }
  const hours = Math.round(minutes / 60)
  return locale === 'en' ? `Responds in ~${hours}h` : `מגיב בדרך כלל תוך ${hours} שע'`
}
