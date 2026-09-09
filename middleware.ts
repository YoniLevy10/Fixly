import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  isLegacyVercelProductionHost,
  normalizeHost,
} from '@/lib/site-hosts'

export async function middleware(request: NextRequest) {
  const host = normalizeHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host'),
  )

  // Keep public links on fixly.tech — bounce production Vercel aliases
  if (isLegacyVercelProductionHost(host)) {
    const dest = new URL(request.url)
    dest.protocol = 'https:'
    dest.host = 'fixly.tech'
    return NextResponse.redirect(dest, 308)
  }

  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
