import { NextResponse } from 'next/server'
import { listProfessionals } from '@/lib/data/professionals-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const categorySlug = searchParams.get('category') ?? undefined
  const sortBy = (searchParams.get('sortBy') as 'rating' | 'price' | 'jobs') ?? 'rating'
  const featured = searchParams.get('featured') === 'true'

  const cacheHeaders = featured
    ? { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
    : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }

  if (featured) {
    const { getFeaturedProfessionalsList } = await import(
      '@/lib/data/professionals-service'
    )
    const data = await getFeaturedProfessionalsList()
    return NextResponse.json(data, { headers: cacheHeaders })
  }

  const data = await listProfessionals({ query, categorySlug, sortBy })
  return NextResponse.json(data, { headers: cacheHeaders })
}
