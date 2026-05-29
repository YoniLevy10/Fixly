import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'גוף הבקשה לא תקין' }, { status: 400 }),
    }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'נתונים לא תקינים',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      ),
    }
  }

  return { success: true, data: parsed.data }
}
