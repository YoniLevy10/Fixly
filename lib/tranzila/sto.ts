const API_BASE = 'https://api.tranzila.com'

type STOResult =
  | { success: true; stoId: string }
  | { success: false; message: string }

/** Create a recurring monthly subscription via Tranzila STO API */
export async function createRecurringSubscription(params: {
  professionalId: string
  token: string
  amount: number
  interval: 'monthly' | 'quarterly' | 'yearly'
}): Promise<STOResult> {
  const { generateTranzilaHeaders, isTranzilaConfigured } = await import('./auth')
  if (!isTranzilaConfigured()) return { success: false, message: 'Tranzila not configured' }

  const headers = generateTranzilaHeaders()
  const terminal = process.env.TRANZILA_TERMINAL!

  const res = await fetch(`${API_BASE}/v2/stos/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      terminal_name: terminal,
      token: params.token,
      sum: params.amount,
      currency: 'ILS',
      frequency: params.interval === 'monthly' ? '12' : params.interval === 'quarterly' ? '4' : '1',
      request_params: { professional_id: params.professionalId, type: 'pro_subscription_recurring' },
    }),
  })
  if (!res.ok) return { success: false, message: 'STO creation failed' }
  const data = await res.json()
  if (data.error_code !== 0) return { success: false, message: data.message || 'STO error' }
  return { success: true, stoId: String(data.sto_id || data.sto_external_id || '') }
}
