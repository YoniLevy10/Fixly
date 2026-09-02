import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push/send'
import { buildWhatsAppLink } from '@/lib/contact/whatsapp-link'

export type InviteCandidate = { professionalId: string }

/**
 * Notify invited professionals about a new consumer (or partner) job.
 * 1) Web Push when the pro has a claimed user_id + subscription
 * 2) WhatsApp deep-link logged as ops fallback when push cannot be delivered
 */
export async function notifyInvitedProfessionals(
  requestId: string,
  title: string,
  candidates: InviteCandidate[],
  options?: { sourceLabel?: string },
): Promise<void> {
  const admin = getAdminSupabaseClient()
  if (!admin || !candidates.length) return

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const dashboardPath = `/pro/dashboard`
  const requestUrl = appUrl ? `${appUrl}${dashboardPath}` : dashboardPath
  const sourceLabel = options?.sourceLabel ?? 'Fixly'

  for (const candidate of candidates) {
    try {
      const { data: pro } = await admin
        .from('professionals')
        .select('user_id, phone, whatsapp_number, title')
        .eq('id', candidate.professionalId)
        .maybeSingle()

      if (!pro) continue

      let pushSent = 0
      if (pro.user_id) {
        const result = await sendPushToUser(pro.user_id as string, {
          title: `עבודה חדשה מ-${sourceLabel}`,
          body: title,
          url: dashboardPath,
          tag: `job-${requestId}`,
        })
        pushSent = result.sent
      }

      if (pushSent === 0) {
        const phone =
          (pro.whatsapp_number as string | null) ?? (pro.phone as string | null) ?? null
        if (phone) {
          const message = [
            `שלום ${pro.title ?? 'בעל מקצוע'},`,
            `יש לך הזמנה חדשה ב-${sourceLabel}:`,
            title,
            `פתח את הדשבורד: ${requestUrl}`,
          ].join('\n')
          const wa = buildWhatsAppLink(phone, message)
          if (wa) {
            console.info(
              '[notify] push missed — WhatsApp fallback for pro',
              candidate.professionalId,
              wa,
            )
          }
        }
      }
    } catch (err) {
      console.error('[notify] invited professional failed', candidate.professionalId, err)
    }
  }
}
