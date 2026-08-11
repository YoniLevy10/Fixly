import webpush from 'web-push'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isVapidConfigured, setupVapid } from '@/lib/push/vapid'
import { trackError } from '@/lib/monitoring/track-error'

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

type SubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/** Send a Web Push notification to all subscriptions for a user. */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!setupVapid() && !isVapidConfigured()) {
    return { sent: 0, failed: 0 }
  }

  const admin = getAdminSupabaseClient()
  if (!admin) return { sent: 0, failed: 0 }

  const { data: rows, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error || !rows?.length) {
    if (error) trackError(error, { route: 'sendPushToUser.select' })
    return { sent: 0, failed: 0 }
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    tag: payload.tag,
  })

  let sent = 0
  let failed = 0

  await Promise.all(
    (rows as SubscriptionRow[]).map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
        )
        sent += 1
      } catch (err) {
        failed += 1
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await admin.from('push_subscriptions').delete().eq('id', row.id)
        } else {
          trackError(err, { route: 'sendPushToUser.send', endpoint: row.endpoint })
        }
      }
    }),
  )

  return { sent, failed }
}
