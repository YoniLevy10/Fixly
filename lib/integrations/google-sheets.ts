import { createSign } from 'node:crypto'
import {
  DEFAULT_SHEET_GID,
  DEFAULT_SHEET_TITLE,
  DEFAULT_SPREADSHEET_ID,
  parseCsv,
} from '@/lib/prospects/outreach-sheet'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

type TokenCache = { token: string; exp: number }
let tokenCache: TokenCache | null = null

export function outreachSpreadsheetId(): string {
  return process.env.OUTREACH_SPREADSHEET_ID?.trim() || DEFAULT_SPREADSHEET_ID
}

export function sheetsWriteConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim() &&
      process.env.GOOGLE_SHEETS_PRIVATE_KEY?.trim(),
  )
}

function privateKey(): string {
  return (process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (tokenCache && tokenCache.exp > now + 60) return tokenCache.token
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim()
  const key = privateKey()
  if (!email || !key) throw new Error('חיבור Google Sheets לא הוגדר')
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: email,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  signer.end()
  const assertion = `${header}.${claim}.${base64url(signer.sign(key))}`
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const body = (await response.json().catch(() => ({}))) as { access_token?: string }
  if (!response.ok || !body.access_token) {
    throw new Error('לא ניתן להתחבר ל-Google Sheets')
  }
  tokenCache = { token: body.access_token, exp: now + 3600 }
  return body.access_token
}

function quoteTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`
}

async function sheetTitle(token: string, spreadsheetId: string): Promise<string> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  )
  if (!response.ok) throw new Error('לא ניתן לקרוא את מבנה הגיליון')
  const body = (await response.json()) as {
    sheets?: Array<{ properties?: { title?: string; sheetId?: number } }>
  }
  const sheets = body.sheets ?? []
  const preferred =
    sheets.find((sheet) => sheet.properties?.title === DEFAULT_SHEET_TITLE) ??
    sheets.find((sheet) => sheet.properties?.title?.includes('מאגר')) ??
    sheets[0]
  return preferred?.properties?.title || DEFAULT_SHEET_TITLE
}

async function readViaApi(spreadsheetId: string): Promise<string[][]> {
  const token = await accessToken()
  const title = await sheetTitle(token, spreadsheetId)
  const range = encodeURIComponent(`${quoteTitle(title)}!A:H`)
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  )
  if (!response.ok) throw new Error('קריאת הגיליון נכשלה')
  const body = (await response.json()) as { values?: string[][] }
  return body.values ?? []
}

async function readViaCsv(spreadsheetId: string): Promise<string[][]> {
  const gid = process.env.OUTREACH_SHEET_GID?.trim() || DEFAULT_SHEET_GID
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; FixlyOutreachSync/1.0; +https://fixly.tech)',
      },
      cache: 'no-store',
      redirect: 'follow',
    },
  )
  const text = await response.text()
  if (!response.ok || !text.includes('אזור') || text.includes('<html')) {
    throw new Error(
      'לא ניתן לקרוא את גיליון הלידים. שתפו אותו עם חשבון השירות של Google, או השאירו את הקישור פתוח לצפייה.',
    )
  }
  return parseCsv(text)
}

export async function readOutreachGrid(): Promise<string[][]> {
  const spreadsheetId = outreachSpreadsheetId()
  if (sheetsWriteConfigured()) {
    try {
      return await readViaApi(spreadsheetId)
    } catch {
      return readViaCsv(spreadsheetId)
    }
  }
  return readViaCsv(spreadsheetId)
}

export type SheetCellWrite = {
  row: number
  column: 'A' | 'B' | 'C' | 'D' | 'F' | 'G' | 'H'
  value: string
}

/** Writes only the status and id columns. Other cells stay as the user edited them. */
export async function writeOutreachCells(writes: SheetCellWrite[]): Promise<boolean> {
  if (!writes.length) return true
  if (!sheetsWriteConfigured()) return false
  const spreadsheetId = outreachSpreadsheetId()
  const token = await accessToken()
  const title = await sheetTitle(token, spreadsheetId)
  const data = [
    { range: `${quoteTitle(title)}!H1`, values: [['מזהה']] },
    ...writes.map((write) => ({
      range: `${quoteTitle(title)}!${write.column}${write.row}`,
      values: [[write.value]],
    })),
  ]
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ valueInputOption: 'RAW', data }),
    },
  )
  if (!response.ok) throw new Error('כתיבה לגיליון נכשלה')
  return true
}
