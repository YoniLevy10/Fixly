import { featureFlags } from '@/lib/feature-flags'

/** Placeholder for APNs / FCM — enable with NEXT_PUBLIC_FF_PUSH=true */
export async function registerPushNotifications(): Promise<void> {
  if (!featureFlags.pushNotifications) return
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export function notifyLocal(title: string, body: string) {
  if (!featureFlags.pushNotifications) return
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return
  new Notification(title, { body })
}
