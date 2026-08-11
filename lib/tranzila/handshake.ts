const API_BASE = 'https://api.tranzila.com'

type HandshakeResult =
  | { success: true; thtk: string }
  | { success: false; message: string }

export async function createHandshake(params: {
  terminalName: string
  sum: number
  requestParams?: Record<string, unknown>
}): Promise<HandshakeResult> {
  const { generateTranzilaHeaders, isTranzilaConfigured } = await import('./auth')
  if (!isTranzilaConfigured()) return { success: false, message: 'Tranzila not configured' }

  const headers = generateTranzilaHeaders()
  const res = await fetch(`${API_BASE}/v2/handshake/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      terminal_name: params.terminalName,
      sum: params.sum,
      request_params: params.requestParams,
    }),
  })
  if (!res.ok) return { success: false, message: 'Handshake failed' }
  const data = await res.json()
  if (data.error_code !== 0) return { success: false, message: data.message || 'Handshake error' }
  return { success: true, thtk: data.thtk }
}
