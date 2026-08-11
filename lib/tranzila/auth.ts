import { createHmac, randomBytes } from 'crypto'

export function generateTranzilaHeaders(): Record<string, string> {
  const appKey = process.env.TRANZILA_API_APP_KEY
  const secret = process.env.TRANZILA_API_SECRET_KEY
  if (!appKey || !secret) return {}

  const time = Math.floor(Date.now() / 1000).toString()
  const nonce = randomBytes(40).toString('hex')
  const accessToken = createHmac('sha256', secret + time + nonce).update(appKey).digest('hex')

  return {
    'Content-Type': 'application/json',
    'X-tranzila-api-app-key': appKey,
    'X-tranzila-api-request-time': time,
    'X-tranzila-api-nonce': nonce,
    'X-tranzila-api-access-token': accessToken,
  }
}

export function isTranzilaConfigured(): boolean {
  return Boolean(
    process.env.TRANZILA_TERMINAL &&
      process.env.TRANZILA_API_APP_KEY &&
      process.env.TRANZILA_API_SECRET_KEY,
  )
}
