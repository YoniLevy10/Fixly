export type SmsOutcome = {
  status: 'accepted' | 'rejected' | 'unknown'
  shipmentId: string | null
}

export function sms019Sender() {
  return process.env.SMS_019_SENDER?.trim() || '0552819086'
}

export function sms019Configured() {
  return Boolean(process.env.SMS_019_USERNAME?.trim() &&
    process.env.SMS_019_TOKEN?.trim() &&
    /^[A-Za-z0-9]{1,11}$/.test(sms019Sender()))
}

/** One campaign submission, never retry after an ambiguous provider response. */
export async function send019Campaign(id: string, message: string, phones: string[], unsubscribe = true): Promise<SmsOutcome> {
  if (!sms019Configured()) throw new Error('חיבור 019 עדיין לא הוגדר')
  if (!phones.length || phones.some(p => !/^05\d{8}$/.test(p)) ||
      !message.trim() || message.length > 1005) throw new Error('נתוני שליחה לא תקינים')
  try {
    const response = await fetch('https://019sms.co.il/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SMS_019_TOKEN!.trim()}`,
      },
      body: JSON.stringify({ sms: {
        user: { username: process.env.SMS_019_USERNAME!.trim() },
        source: sms019Sender(),
        destinations: { phone: phones.map(phone => ({ _: phone })) },
        message,
        campaign_name: `Fixly-${id}`,
        add_unsubscribe: unsubscribe ? '3' : '0',
      } }),
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    const data = await response.json()
    if (response.ok && (data.status === 0 || data.status === '0') && data.shipment_id) {
      return { status: 'accepted', shipmentId: String(data.shipment_id) }
    }
    // Only an explicit provider error means a safe rejection. HTTP errors,
    // malformed responses and timeouts may happen after the provider accepted it.
    const explicitError = (typeof data.status === 'number' && data.status !== 0) ||
      (typeof data.status === 'string' && /^-?\d+$/.test(data.status) && Number(data.status) !== 0)
    return { status: explicitError ? 'rejected' : 'unknown', shipmentId: null }
  } catch {
    return { status: 'unknown', shipmentId: null }
  }
}
