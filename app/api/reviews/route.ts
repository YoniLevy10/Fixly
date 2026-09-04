import { NextResponse } from 'next/server'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import {
  supabaseCreateReview,
  supabaseListReviewsByProfessional,
} from '@/lib/data/supabase-reviews'
import {
  createDemoReview,
  listDemoReviewsByProfessional,
} from '@/lib/data/review-store'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { createReviewSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'

export async function GET(request: Request) {
  const professionalId = new URL(request.url).searchParams.get('professionalId')
  if (!professionalId) {
    return NextResponse.json({ error: 'professionalId required' }, { status: 400 })
  }

  if (resolveDataBackend() === 'supabase') {
    const reviews = await supabaseListReviewsByProfessional(professionalId)
    return NextResponse.json(reviews ?? [])
  }

  if (resolveDataBackend() === 'mock') {
    return NextResponse.json(listDemoReviewsByProfessional(professionalId))
  }

  return NextResponse.json({ error: 'No data backend' }, { status: 503 })
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'reviews-post', 20, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, createReviewSchema)
    if (!parsed.success) return parsed.response

    if (resolveDataBackend() === 'mock') {
      const review = createDemoReview(parsed.data)
      return NextResponse.json(review, { status: 201 })
    }

    if (resolveDataBackend() !== 'supabase') {
      return NextResponse.json({ error: 'Supabase required' }, { status: 503 })
    }

    const review = await supabaseCreateReview(parsed.data)

    if (!review) {
      return NextResponse.json({ error: 'לא ניתן לשמור ביקורת' }, { status: 400 })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    trackError(error, { route: 'POST /api/reviews' })
    return NextResponse.json({ error: 'שגיאה בשמירת ביקורת' }, { status: 500 })
  }
}
