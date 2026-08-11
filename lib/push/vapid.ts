import webpush from 'web-push'

let configured = false

/** Configure web-push with VAPID keys. Returns false if keys are missing. */
export function setupVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:ops@fixly.app'

  if (!publicKey || !privateKey) {
    configured = false
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || ''
}

export function isVapidConfigured(): boolean {
  return configured || setupVapid()
}
