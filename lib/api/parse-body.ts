import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  options?: { code?: string },
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const code = options?.code ?? 'INVALID_INPUT'
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'גוף הבקשה לא תקין', code },
        { status: 400 },
      ),
    }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'נתונים לא תקינים',
          code,
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      ),
    }
  }

  return { success: true, data: parsed.data }
}
