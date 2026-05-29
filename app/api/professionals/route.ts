import { NextResponse } from 'next/server'
import { listProfessionals } from '@/lib/data/professionals-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const categorySlug = searchParams.get('category') ?? undefined
  const sortBy = (searchParams.get('sortBy') as 'rating' | 'price' | 'jobs') ?? 'rating'
  const featured = searchParams.get('featured') === 'true'

  if (featured) {
    const { getFeaturedProfessionalsList } = await import(
      '@/lib/data/professionals-service'
    )
    const data = await getFeaturedProfessionalsList()
    return NextResponse.json(data)
  }

  const data = await listProfessionals({ query, categorySlug, sortBy })
  return NextResponse.json(data)
}
