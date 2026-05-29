import { NextResponse } from 'next/server'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import {
  supabaseCreateReview,
  supabaseListReviewsByProfessional,
} from '@/lib/data/supabase-reviews'

export async function GET(request: Request) {
  const professionalId = new URL(request.url).searchParams.get('professionalId')
  if (!professionalId) {
    return NextResponse.json({ error: 'professionalId required' }, { status: 400 })
  }

  if (resolveDataBackend() === 'supabase') {
    const reviews = await supabaseListReviewsByProfessional(professionalId)
    return NextResponse.json(reviews ?? [])
  }

  return NextResponse.json([])
}

export async function POST(request: Request) {
  if (resolveDataBackend() !== 'supabase') {
    return NextResponse.json({ error: 'Supabase required' }, { status: 503 })
  }

  const body = await request.json()
  const review = await supabaseCreateReview({
    requestId: body.requestId,
    professionalId: body.professionalId,
    rating: body.rating,
    text: body.text,
  })

  if (!review) {
    return NextResponse.json({ error: 'לא ניתן לשמור ביקורת' }, { status: 400 })
  }

  return NextResponse.json(review, { status: 201 })
}
