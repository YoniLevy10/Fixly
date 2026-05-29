import { featureFlags } from '@/lib/feature-flags'

const PERMISSION_KEY = 'fixly-push-asked'

export async function registerPushNotifications(): Promise<boolean> {
  if (!featureFlags.pushNotifications) return false
  if (typeof window === 'undefined' || !('Notification' in window)) return false

  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const asked = localStorage.getItem(PERMISSION_KEY)
  if (asked && Notification.permission === 'default') {
    return false
  }

  const result = await Notification.requestPermission()
  localStorage.setItem(PERMISSION_KEY, '1')
  return result === 'granted'
}

export function canSendPush(): boolean {
  return (
    featureFlags.pushNotifications &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

export function notifyLocal(
  title: string,
  body: string,
  options?: { tag?: string; onClickPath?: string }
) {
  if (!canSendPush()) return

  const n = new Notification(title, {
    body,
    tag: options?.tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  })

  if (options?.onClickPath) {
    n.onclick = () => {
      window.focus()
      window.location.href = options.onClickPath!
      n.close()
    }
  }
}

const sentTags = new Set<string>()

/** Dedupe by tag so we do not spam the user */
export function notifyLocalOnce(
  tag: string,
  title: string,
  body: string,
  onClickPath?: string
) {
  if (sentTags.has(tag)) return
  sentTags.add(tag)
  notifyLocal(title, body, { tag, onClickPath })
}

export function resetNotifyTags() {
  sentTags.clear()
}
