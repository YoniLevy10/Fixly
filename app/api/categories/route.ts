import { NextResponse } from 'next/server'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { supabaseListCategories } from '@/lib/data/supabase-categories'

export async function GET() {
  const backend = resolveDataBackend()

  const cacheHeaders = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  }

  if (backend === 'supabase') {
    const fromDb = await supabaseListCategories()
    if (fromDb?.length) {
      return NextResponse.json(fromDb, { headers: cacheHeaders })
    }
  }

  return NextResponse.json(
    { error: 'No data backend configured' },
    { status: 503 }
  )
}
